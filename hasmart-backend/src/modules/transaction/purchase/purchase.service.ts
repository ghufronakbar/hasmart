import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RefreshStockService } from "../refresh-stock/refresh-stock.service";
import {
  PurchaseBodyType,
  PurchaseItemType,
  PurchaseDiscountType,
} from "./purchase.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import {
  Prisma,
  RecordActionModelType,
  RecordActionType,
} from ".prisma/client";
import { RefreshBuyPriceService } from "../refresh-buy-price/refresh-buy-price.service";
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
  recordedAfterTaxAmount: Decimal;
  discounts: CalculatedDiscount[];
}

export class PurchaseService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshStockService: RefreshStockService,
    private readonly refreshBuyPriceService: RefreshBuyPriceService,
  ) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Prisma.TransactionPurchaseWhereInput {
    const where: Prisma.TransactionPurchaseWhereInput = {
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
  ): Prisma.TransactionPurchaseFindManyArgs {
    const args: Prisma.TransactionPurchaseFindManyArgs = {
      where: this.constructWhere(filter, branchQuery),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: this.constructOrder(filter),
      include: {
        masterSupplier: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true } },
        transactionPurchaseItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: { select: { id: true, unit: true } },
            transactionPurchaseDiscounts: {
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
  ): Prisma.TransactionPurchaseOrderByWithRelationInput | undefined {
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

  getAllPurchases = async (
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ) => {
    const [rows, count] = await Promise.all([
      this.prisma.transactionPurchase.findMany(
        this.constructArgs(filter, branchQuery),
      ),
      this.prisma.transactionPurchase.count({
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

  getPurchaseById = async (id: number) => {
    const data = await this.prisma.transactionPurchase.findFirst({
      where: { id, deletedAt: null },
      include: {
        masterSupplier: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true } },
        transactionPurchaseItems: {
          where: { deletedAt: null },
          include: {
            masterItem: {
              select: {
                id: true,
                name: true,
                code: true,
                masterItemVariants: {
                  where: { deletedAt: null },
                  select: {
                    id: true,
                    unit: true,
                    amount: true,
                    sellPrice: true,
                  },
                },
              },
            },
            masterItemVariant: {
              select: { id: true, unit: true, amount: true },
            },
            transactionPurchaseDiscounts: {
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

  getPurchaseByInvoice = async (invoiceNumber: string) => {
    const data = await this.prisma.transactionPurchase.findFirst({
      where: {
        invoiceNumber: { equals: invoiceNumber, mode: "insensitive" },
        deletedAt: null,
      },
      include: {
        masterSupplier: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true } },
        transactionPurchaseItems: {
          where: { deletedAt: null },
          include: {
            masterItem: {
              select: {
                id: true,
                name: true,
                code: true,
                masterItemVariants: {
                  where: { deletedAt: null },
                  select: {
                    id: true,
                    unit: true,
                    amount: true,
                    sellPrice: true,
                  },
                },
              },
            },
            masterItemVariant: {
              select: { id: true, unit: true, amount: true },
            },
            transactionPurchaseDiscounts: {
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

  private async validateAndPrepare(data: PurchaseBodyType) {
    // Validate unique variant IDs
    const variantIds = data.items.map((item) => item.masterItemVariantId);
    const uniqueVariantIds = [...new Set(variantIds)];
    if (variantIds.length !== uniqueVariantIds.length) {
      throw new BadRequestError("Setiap item variant harus unique");
    }

    // Validate supplier exists by code
    const supplier = await this.prisma.masterSupplier.findFirst({
      where: {
        code: { equals: data.masterSupplierCode, mode: "insensitive" },
        deletedAt: null,
      },
    });
    if (!supplier) {
      throw new BadRequestError(
        `Supplier dengan kode "${data.masterSupplierCode}" tidak ditemukan`,
      );
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

    return { variantMap, supplierId: supplier.id };
  }

  private calculateItems(
    items: PurchaseItemType[],
    variantMap: Map<
      number,
      { id: number; masterItemId: number; amount: number }
    >,
    taxPercentage: Decimal,
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
      // afterTax = total + (total * taxPercentage / 100)
      const recordedAfterTaxAmount = recordedTotalAmount.add(
        recordedTotalAmount.mul(taxPercentage).div(100),
      );

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
        recordedAfterTaxAmount,
        discounts,
      };
    });
  }

  createPurchase = async (data: PurchaseBodyType, userId: number) => {
    const { variantMap, supplierId } = await this.validateAndPrepare(data);
    const calculatedItems = this.calculateItems(
      data.items,
      variantMap,
      data.taxPercentage,
    );

    // Calculate header totals using Decimal methods
    const recordedSubTotalAmount = calculatedItems.reduce(
      (sum, item) => sum.add(item.recordedSubTotalAmount),
      new Decimal(0),
    );
    const recordedDiscountAmount = calculatedItems.reduce(
      (sum, item) => sum.add(item.recordedDiscountAmount),
      new Decimal(0),
    );

    // from percentage to amount: taxPercentage / 100 * (subTotal - discount)
    const recordedTaxAmount = data.taxPercentage
      .div(100)
      .mul(recordedSubTotalAmount.sub(recordedDiscountAmount));
    const recordedTotalAmount = recordedSubTotalAmount
      .sub(recordedDiscountAmount)
      .add(recordedTaxAmount);

    // Create in transaction
    const purchase = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transactionPurchase.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          transactionDate: data.transactionDate,
          dueDate: data.dueDate,
          notes: data.notes || "",
          masterSupplierId: supplierId,
          branchId: data.branchId,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTaxAmount,
          recordedTaxPercentage: data.taxPercentage,
          recordedTotalAmount,
          transactionPurchaseItems: {
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
              recordedAfterTaxAmount: item.recordedAfterTaxAmount,
              transactionPurchaseDiscounts: {
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
          transactionPurchaseItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_PURCHASE,
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
    await Promise.all([
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(data.branchId, itemId),
      ),
      ...uniqueItemIds.map((itemId) =>
        this.refreshBuyPriceService.refreshBuyPrice(itemId),
      ),
    ]);

    return this.getPurchaseById(purchase.id);
  };

  updatePurchase = async (
    id: number,
    data: PurchaseBodyType,
    userId: number,
  ) => {
    const existing = await this.prisma.transactionPurchase.findFirst({
      where: { id, deletedAt: null },
      include: { transactionPurchaseItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const { variantMap, supplierId } = await this.validateAndPrepare(data);
    const calculatedItems = this.calculateItems(
      data.items,
      variantMap,
      data.taxPercentage,
    );

    // Calculate header totals using Decimal methods
    const recordedSubTotalAmount = calculatedItems.reduce(
      (sum, item) => sum.add(item.recordedSubTotalAmount),
      new Decimal(0),
    );
    const recordedDiscountAmount = calculatedItems.reduce(
      (sum, item) => sum.add(item.recordedDiscountAmount),
      new Decimal(0),
    );

    // from percentage to amount: taxPercentage / 100 * (subTotal - discount)
    const recordedTaxAmount = data.taxPercentage
      .div(100)
      .mul(recordedSubTotalAmount.sub(recordedDiscountAmount));
    const recordedTotalAmount = recordedSubTotalAmount
      .sub(recordedDiscountAmount)
      .add(recordedTaxAmount);

    // Get old item IDs for stock refresh
    const oldItemIds = existing.transactionPurchaseItems.map(
      (i) => i.masterItemId,
    );

    // Update in transaction (delete items then insert new)
    const purchase = await this.prisma.$transaction(async (tx) => {
      // Delete old discounts and items
      await tx.transactionPurchaseDiscount.deleteMany({
        where: {
          transactionPurchaseItem: {
            transactionPurchaseId: id,
          },
        },
      });
      await tx.transactionPurchaseItem.deleteMany({
        where: { transactionPurchaseId: id },
      });

      // Update header and create new items
      const updated = await tx.transactionPurchase.update({
        where: { id },
        data: {
          invoiceNumber: data.invoiceNumber,
          transactionDate: data.transactionDate,
          dueDate: data.dueDate,
          notes: data.notes || "",
          masterSupplierId: supplierId,
          branchId: data.branchId,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTaxAmount,
          recordedTaxPercentage: data.taxPercentage,
          recordedTotalAmount,
          transactionPurchaseItems: {
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
              recordedAfterTaxAmount: item.recordedAfterTaxAmount,
              transactionPurchaseDiscounts: {
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
          transactionPurchaseItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_PURCHASE,
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

    // Refresh buy price for all affected items (old + new)
    await Promise.all(
      allItemIds.map((itemId) =>
        this.refreshBuyPriceService.refreshBuyPrice(itemId),
      ),
    );

    return this.getPurchaseById(purchase.id);
  };

  deletePurchase = async (id: number, userId: number) => {
    const existing = await this.prisma.transactionPurchase.findFirst({
      where: { id, deletedAt: null },
      include: { transactionPurchaseItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Soft delete the purchase
      const result = await tx.transactionPurchase.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_PURCHASE,
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
    const itemIds = existing.transactionPurchaseItems.map(
      (i) => i.masterItemId,
    );
    const uniqueItemIds = [...new Set(itemIds)];
    await Promise.all([
      // refresh stock for all items
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(existing.branchId, itemId),
      ),
      // refresh buy price for all items
      ...uniqueItemIds.map((itemId) =>
        this.refreshBuyPriceService.refreshBuyPrice(itemId),
      ),
    ]);

    return deleted;
  };
}
