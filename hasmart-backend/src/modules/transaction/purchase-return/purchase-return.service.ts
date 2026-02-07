import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RefreshStockService } from "../refresh-stock/refresh-stock.service";
import {
  PurchaseReturnBodyType,
  PurchaseReturnItemType,
} from "./purchase-return.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import {
  Prisma,
  RecordActionModelType,
  RecordActionType,
} from ".prisma/client";
import { BranchQueryType } from "src/middleware/use-branch";
import { Decimal } from "@prisma/client/runtime/library";

interface CalculatedDiscount {
  percentage: Decimal;
  recordedAmount: Decimal;
  orderIndex: number;
}

interface CalculatedItem {
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  recordedConversion: number;
  totalQty: number;
  purchasePrice: Decimal;
  recordedSubTotalAmount: Decimal;
  recordedDiscountAmount: Decimal;
  recordedTotalAmount: Decimal;
  discounts: CalculatedDiscount[];
}

export class PurchaseReturnService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshStockService: RefreshStockService,
  ) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Prisma.TransactionPurchaseReturnWhereInput {
    const where: Prisma.TransactionPurchaseReturnWhereInput = {
      deletedAt: null,
      branchId: branchQuery?.branchId,
      OR: filter?.search
        ? [
            { invoiceNumber: { contains: filter.search, mode: "insensitive" } },
            { notes: { contains: filter.search, mode: "insensitive" } },
            {
              masterSupplier: {
                OR: [
                  { name: { contains: filter.search, mode: "insensitive" } },
                  { code: { contains: filter.search, mode: "insensitive" } },
                ],
              },
            },
          ]
        : undefined,
    };

    if (filter?.dateStart || filter?.dateEnd) {
      where.transactionDate = {};

      if (filter.dateStart) {
        where.transactionDate.gte = filter.dateStart;
      }

      if (filter.dateEnd) {
        const nextDay = new Date(filter.dateEnd);
        nextDay.setDate(nextDay.getDate() + 1);

        where.transactionDate.lt = nextDay;
      }
    }
    return where;
  }

  private constructArgs(
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Prisma.TransactionPurchaseReturnFindManyArgs {
    const args: Prisma.TransactionPurchaseReturnFindManyArgs = {
      where: this.constructWhere(filter, branchQuery),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: this.constructOrder(filter),
      include: {
        masterSupplier: { select: { id: true, code: true, name: true } },
        transactionPurchase: { select: { id: true, invoiceNumber: true } },
        branch: { select: { id: true, name: true } },
        transactionPurchaseReturnItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: { select: { id: true, unit: true } },
            transactionPurchaseReturnDiscounts: {
              where: { deletedAt: null },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    };
    return args;
  }

  private constructOrder(
    filter?: FilterQueryType,
  ): Prisma.TransactionPurchaseReturnOrderByWithRelationInput | undefined {
    switch (filter?.sortBy) {
      case "masterSupplierName":
        return {
          masterSupplier: {
            name: filter?.sort,
          },
        };
      default:
        return filter?.sortBy
          ? { [filter?.sortBy]: filter?.sort }
          : { id: "desc" };
    }
  }

  getAllPurchaseReturns = async (
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ) => {
    const [rows, count] = await Promise.all([
      this.prisma.transactionPurchaseReturn.findMany(
        this.constructArgs(filter, branchQuery),
      ),
      this.prisma.transactionPurchaseReturn.count({
        where: this.constructWhere(filter, branchQuery),
      }),
    ]);

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });
    return { rows, pagination };
  };

  getPurchaseReturnById = async (id: number) => {
    const data = await this.prisma.transactionPurchaseReturn.findFirst({
      where: { id, deletedAt: null },
      include: {
        masterSupplier: { select: { id: true, code: true, name: true } },
        transactionPurchase: { select: { id: true, invoiceNumber: true } },
        branch: { select: { id: true, name: true } },
        transactionPurchaseReturnItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: {
              select: { id: true, unit: true, amount: true },
            },
            transactionPurchaseReturnDiscounts: {
              where: { deletedAt: null },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return data;
  };

  private async validateAndPrepare(data: PurchaseReturnBodyType) {
    // Validate unique variant IDs
    const variantIds = data.items.map((item) => item.masterItemVariantId);
    const uniqueVariantIds = [...new Set(variantIds)];
    if (variantIds.length !== uniqueVariantIds.length) {
      throw new BadRequestError("Setiap item variant harus unique");
    }

    // Validate supplier exists
    const supplier = await this.prisma.masterSupplier.findFirst({
      where: { id: data.masterSupplierId, deletedAt: null },
    });
    if (!supplier) {
      throw new BadRequestError("Supplier tidak ditemukan");
    }

    // Validate branch exists
    const branch = await this.prisma.branch.findFirst({
      where: { id: data.branchId, deletedAt: null },
    });
    if (!branch) {
      throw new BadRequestError("Cabang tidak ditemukan");
    }

    // Validate all variants exist and get conversion
    const variants = await this.prisma.masterItemVariant.findMany({
      where: {
        id: { in: uniqueVariantIds },
        deletedAt: null,
        masterItem: { deletedAt: null },
      },
      select: { id: true, masterItemId: true, amount: true },
    });

    if (variants.length !== uniqueVariantIds.length) {
      throw new BadRequestError("Beberapa variant tidak ditemukan");
    }

    // Create variant map for quick lookup
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return { variantMap };
  }

  private calculateItems(
    items: PurchaseReturnItemType[],
    variantMap: Map<
      number,
      { id: number; masterItemId: number; amount: number }
    >,
  ): CalculatedItem[] {
    return items.map((item) => {
      const variant = variantMap.get(item.masterItemVariantId)!;
      const recordedConversion = variant.amount;
      const totalQty = item.qty * recordedConversion;
      // Decimal: qty * purchasePrice
      const recordedSubTotalAmount = item.purchasePrice.mul(item.qty);

      // Calculate discounts using Decimal methods
      let runningAmount = recordedSubTotalAmount;
      let totalDiscountAmount = new Decimal(0);
      const discounts: CalculatedDiscount[] = (item.discounts || []).map(
        (d, index) => {
          // discountAmount = runningAmount * (percentage / 100)
          const discountAmount = runningAmount.mul(d.percentage).div(100);
          totalDiscountAmount = totalDiscountAmount.add(discountAmount);
          runningAmount = runningAmount.sub(discountAmount);
          return {
            percentage: d.percentage,
            recordedAmount: discountAmount,
            orderIndex: index + 1,
          };
        },
      );

      const recordedTotalAmount =
        recordedSubTotalAmount.sub(totalDiscountAmount);

      return {
        masterItemId: variant.masterItemId,
        masterItemVariantId: item.masterItemVariantId,
        qty: item.qty,
        recordedConversion,
        totalQty,
        purchasePrice: item.purchasePrice,
        recordedSubTotalAmount,
        recordedDiscountAmount: totalDiscountAmount,
        recordedTotalAmount,
        discounts,
      };
    });
  }

  createPurchaseReturn = async (
    data: PurchaseReturnBodyType,
    userId: number,
  ) => {
    const originalInvoice = await this.prisma.transactionPurchase.findFirst({
      where: {
        invoiceNumber: {
          equals: data.originalInvoiceNumber,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });

    if (!originalInvoice) {
      throw new BadRequestError("Invoice original tidak ditemukan");
    }

    const { variantMap } = await this.validateAndPrepare(data);
    const calculatedItems = this.calculateItems(data.items, variantMap);

    // Calculate header totals using Decimal methods
    const recordedSubTotalAmount = calculatedItems.reduce(
      (sum, item) => sum.add(item.recordedSubTotalAmount),
      new Decimal(0),
    );
    const recordedDiscountAmount = calculatedItems.reduce(
      (sum, item) => sum.add(item.recordedDiscountAmount),
      new Decimal(0),
    );

    // amount tax: taxPercentage / 100 * (subTotal - discount)
    const recordedTaxAmount = data.taxPercentage
      .div(100)
      .mul(recordedSubTotalAmount.sub(recordedDiscountAmount));
    const recordedTotalAmount = recordedSubTotalAmount
      .sub(recordedDiscountAmount)
      .add(recordedTaxAmount);

    // Create in transaction
    const purchaseReturn = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transactionPurchaseReturn.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          transactionDate: data.transactionDate,
          dueDate: data.dueDate,
          notes: data.notes || "",
          masterSupplierId: data.masterSupplierId,
          branchId: data.branchId,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTaxAmount,
          recordedTaxPercentage: data.taxPercentage,
          recordedTotalAmount,
          transactionPurchaseId: originalInvoice.id,
          transactionPurchaseReturnItems: {
            create: calculatedItems.map((item) => ({
              masterItemId: item.masterItemId,
              masterItemVariantId: item.masterItemVariantId,
              qty: item.qty,
              recordedConversion: item.recordedConversion,
              totalQty: item.totalQty,
              purchasePrice: item.purchasePrice,
              recordedSubTotalAmount: item.recordedSubTotalAmount,
              recordedDiscountAmount: item.recordedDiscountAmount,
              recordedTotalAmount: item.recordedTotalAmount,
              transactionPurchaseReturnDiscounts: {
                create: item.discounts.map((d) => ({
                  orderIndex: d.orderIndex,
                  percentage: d.percentage,
                  recordedAmount: d.recordedAmount,
                })),
              },
            })),
          },
        },
        include: {
          transactionPurchaseReturnItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_PURCHASE_RETURN,
          modelId: created.id,
          actionType: RecordActionType.CREATE,
          payloadBefore: Prisma.DbNull,
          payloadAfter: created as unknown as Prisma.JsonObject,
          userId,
        },
      });

      return created;
    });

    // Refresh stock for all unique items (after transaction)
    const uniqueItemIds = [
      ...new Set(calculatedItems.map((i) => i.masterItemId)),
    ];
    await Promise.all(
      uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(data.branchId, itemId),
      ),
    );

    return this.getPurchaseReturnById(purchaseReturn.id);
  };

  updatePurchaseReturn = async (
    id: number,
    data: PurchaseReturnBodyType,
    userId: number,
  ) => {
    const existing = await this.prisma.transactionPurchaseReturn.findFirst({
      where: { id, deletedAt: null },
      include: { transactionPurchaseReturnItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const { variantMap } = await this.validateAndPrepare(data);
    const calculatedItems = this.calculateItems(data.items, variantMap);

    // Calculate header totals using Decimal methods
    const recordedSubTotalAmount = calculatedItems.reduce(
      (sum, item) => sum.add(item.recordedSubTotalAmount),
      new Decimal(0),
    );
    const recordedDiscountAmount = calculatedItems.reduce(
      (sum, item) => sum.add(item.recordedDiscountAmount),
      new Decimal(0),
    );
    const recordedTaxAmount = data.taxPercentage
      .div(100)
      .mul(recordedSubTotalAmount.sub(recordedDiscountAmount));
    const recordedTotalAmount = recordedSubTotalAmount
      .sub(recordedDiscountAmount)
      .add(recordedTaxAmount);

    // Get old item IDs for stock refresh
    const oldItemIds = existing.transactionPurchaseReturnItems.map(
      (i) => i.masterItemId,
    );

    // Update in transaction (delete items then insert new)
    const purchaseReturn = await this.prisma.$transaction(async (tx) => {
      // Delete old discounts and items
      await tx.transactionPurchaseReturnDiscount.deleteMany({
        where: {
          transactionPurchaseReturnItem: {
            transactionPurchaseReturnId: id,
          },
        },
      });
      await tx.transactionPurchaseReturnItem.deleteMany({
        where: { transactionPurchaseReturnId: id },
      });

      // Update header and create new items
      const updated = await tx.transactionPurchaseReturn.update({
        where: { id },
        data: {
          invoiceNumber: data.invoiceNumber,
          transactionDate: data.transactionDate,
          dueDate: data.dueDate,
          notes: data.notes || "",
          masterSupplierId: data.masterSupplierId,
          branchId: data.branchId,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTaxAmount,
          recordedTaxPercentage: data.taxPercentage,
          recordedTotalAmount,
          transactionPurchaseReturnItems: {
            create: calculatedItems.map((item) => ({
              masterItemId: item.masterItemId,
              masterItemVariantId: item.masterItemVariantId,
              qty: item.qty,
              recordedConversion: item.recordedConversion,
              totalQty: item.totalQty,
              purchasePrice: item.purchasePrice,
              recordedSubTotalAmount: item.recordedSubTotalAmount,
              recordedDiscountAmount: item.recordedDiscountAmount,
              recordedTotalAmount: item.recordedTotalAmount,
              transactionPurchaseReturnDiscounts: {
                create: item.discounts.map((d) => ({
                  orderIndex: d.orderIndex,
                  percentage: d.percentage,
                  recordedAmount: d.recordedAmount,
                })),
              },
            })),
          },
        },
        include: {
          transactionPurchaseReturnItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_PURCHASE_RETURN,
          modelId: updated.id,
          actionType: RecordActionType.UPDATE,
          payloadBefore: existing as unknown as Prisma.JsonObject,
          payloadAfter: updated as unknown as Prisma.JsonObject,
          userId,
        },
      });

      return updated;
    });

    // Refresh stock for all affected items (old + new)
    const newItemIds = calculatedItems.map((i) => i.masterItemId);
    const allItemIds = [...new Set([...oldItemIds, ...newItemIds])];
    await Promise.all(
      allItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(data.branchId, itemId),
      ),
    );

    // Also refresh old branch if changed
    if (existing.branchId !== data.branchId) {
      await Promise.all(
        oldItemIds.map((itemId) =>
          this.refreshStockService.refreshRealStock(existing.branchId, itemId),
        ),
      );
    }

    return this.getPurchaseReturnById(purchaseReturn.id);
  };

  deletePurchaseReturn = async (id: number, userId: number) => {
    const existing = await this.prisma.transactionPurchaseReturn.findFirst({
      where: { id, deletedAt: null },
      include: { transactionPurchaseReturnItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Soft delete the purchase return
      const result = await tx.transactionPurchaseReturn.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_PURCHASE_RETURN,
          modelId: id,
          actionType: RecordActionType.DELETE,
          payloadBefore: existing as unknown as Prisma.JsonObject,
          payloadAfter: Prisma.DbNull,
          userId,
        },
      });

      return result;
    });

    // Refresh stock for all items
    const itemIds = existing.transactionPurchaseReturnItems.map(
      (i) => i.masterItemId,
    );
    const uniqueItemIds = [...new Set(itemIds)];
    await Promise.all(
      uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(existing.branchId, itemId),
      ),
    );

    return deleted;
  };
}
