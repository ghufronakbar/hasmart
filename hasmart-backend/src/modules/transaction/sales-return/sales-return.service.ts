import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RefreshStockService } from "../refresh-stock/refresh-stock.service";
import {
  SalesReturnBodyType,
  SalesReturnItemType,
} from "./sales-return.validator";
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
  salesPrice: Decimal;
  recordedSubTotalAmount: Decimal;
  recordedDiscountAmount: Decimal;
  recordedTotalAmount: Decimal;
  discounts: CalculatedDiscount[];
}

export class SalesReturnService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshStockService: RefreshStockService,
  ) {
    super();
  }

  /**
   * Generate return number with format: TSR-{YYYYMMDD}-{SEQUENCE}
   */
  private async generateReturnNumber(branchId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `TSR-${dateStr}`;

    // Get the last return number of today
    const lastReturn = await this.prisma.transactionSalesReturn.findFirst({
      where: {
        returnNumber: { startsWith: prefix },
        branchId,
      },
      orderBy: { returnNumber: "desc" },
    });

    let sequence = 1;
    if (lastReturn) {
      const lastSequence = parseInt(lastReturn.returnNumber.split("-")[2], 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(4, "0")}`;
  }

  private constructWhere(
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Prisma.TransactionSalesReturnWhereInput {
    const where: Prisma.TransactionSalesReturnWhereInput = {
      deletedAt: null,
      branchId: branchQuery?.branchId,
      OR: filter?.search
        ? [
            { returnNumber: { contains: filter.search, mode: "insensitive" } },
            { notes: { contains: filter.search, mode: "insensitive" } },
            {
              transactionSales: {
                invoiceNumber: { contains: filter.search, mode: "insensitive" },
              },
            },
            {
              masterMember: {
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
  ): Prisma.TransactionSalesReturnFindManyArgs {
    const args: Prisma.TransactionSalesReturnFindManyArgs = {
      where: this.constructWhere(filter, branchQuery),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: this.constructOrder(filter),
      include: {
        transactionSales: { select: { id: true, invoiceNumber: true } },
        masterMember: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true } },
        transactionSalesReturnItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: { select: { id: true, unit: true } },
            transactionSalesReturnDiscounts: {
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
  ): Prisma.TransactionSalesReturnOrderByWithRelationInput | undefined {
    switch (filter?.sortBy) {
      case "masterMember_name":
        return {
          masterMember: {
            name: filter?.sort,
          },
        };
      case "transactionSales_invoiceNumber":
        return {
          transactionSales: {
            invoiceNumber: filter?.sort,
          },
        };
      default:
        return filter?.sortBy
          ? { [filter?.sortBy]: filter?.sort }
          : { id: "desc" };
    }
  }

  getAllSalesReturns = async (
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ) => {
    const [rows, count] = await Promise.all([
      this.prisma.transactionSalesReturn.findMany(
        this.constructArgs(filter, branchQuery),
      ),
      this.prisma.transactionSalesReturn.count({
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

  getSalesReturnById = async (id: number) => {
    const data = await this.prisma.transactionSalesReturn.findFirst({
      where: { id, deletedAt: null },
      include: {
        transactionSales: { select: { id: true, invoiceNumber: true } },
        masterMember: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true } },
        transactionSalesReturnItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: {
              select: { id: true, unit: true, amount: true },
            },
            transactionSalesReturnDiscounts: {
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

  private async validateAndPrepare(data: SalesReturnBodyType) {
    // Validate unique variant IDs
    const variantIds = data.items.map((item) => item.masterItemVariantId);
    const uniqueVariantIds = [...new Set(variantIds)];
    if (variantIds.length !== uniqueVariantIds.length) {
      throw new BadRequestError("Setiap item variant harus unique");
    }

    // Validate and get original sales transaction by invoice number
    const originalSales = await this.prisma.transactionSales.findFirst({
      where: {
        invoiceNumber: data.originalInvoiceNumber,
        deletedAt: null,
      },
    });
    if (!originalSales) {
      throw new BadRequestError(
        `Invoice dengan nomor ${data.originalInvoiceNumber} tidak ditemukan`,
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

    return {
      variantMap,
      transactionSalesId: originalSales.id,
      memberId: originalSales.masterMemberId,
    };
  }

  private calculateItems(
    items: SalesReturnItemType[],
    variantMap: Map<
      number,
      { id: number; masterItemId: number; amount: number }
    >,
  ): CalculatedItem[] {
    return items.map((item) => {
      const variant = variantMap.get(item.masterItemVariantId)!;
      const recordedConversion = variant.amount;
      const totalQty = item.qty * recordedConversion;
      // Decimal: qty * salesPrice
      const recordedSubTotalAmount = item.salesPrice.mul(item.qty);

      // Calculate discounts using Decimal methods
      let runningAmount = recordedSubTotalAmount;
      let totalDiscountAmount = new Decimal(0);
      const discounts: CalculatedDiscount[] = (item.discounts || []).map(
        (d, index) => {
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
        salesPrice: item.salesPrice,
        recordedSubTotalAmount,
        recordedDiscountAmount: totalDiscountAmount,
        recordedTotalAmount,
        discounts,
      };
    });
  }

  createSalesReturn = async (data: SalesReturnBodyType, userId: number) => {
    const { variantMap, transactionSalesId, memberId } =
      await this.validateAndPrepare(data);
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
    const recordedTotalAmount = recordedSubTotalAmount.sub(
      recordedDiscountAmount,
    );

    // Generate return number
    const returnNumber = await this.generateReturnNumber(data.branchId);

    // Create in transaction
    const salesReturn = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transactionSalesReturn.create({
        data: {
          returnNumber,
          transactionSalesId,
          notes: data.notes || "",
          masterMemberId: memberId,
          branchId: data.branchId,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTotalAmount,
          transactionDate: data.transactionDate,
          transactionSalesReturnItems: {
            create: calculatedItems.map((item) => ({
              masterItemId: item.masterItemId,
              masterItemVariantId: item.masterItemVariantId,
              qty: item.qty,
              recordedConversion: item.recordedConversion,
              totalQty: item.totalQty,
              salesPrice: item.salesPrice,
              recordedSubTotalAmount: item.recordedSubTotalAmount,
              recordedDiscountAmount: item.recordedDiscountAmount,
              recordedTotalAmount: item.recordedTotalAmount,
              transactionSalesReturnDiscounts: {
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
          transactionSalesReturnItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_SALES_RETURN,
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
        this.refreshStockService.refreshFrontStock(data.branchId, itemId),
      ),
    ]);

    return this.getSalesReturnById(salesReturn.id);
  };

  updateSalesReturn = async (
    id: number,
    data: SalesReturnBodyType,
    userId: number,
  ) => {
    const existing = await this.prisma.transactionSalesReturn.findFirst({
      where: { id, deletedAt: null },
      include: { transactionSalesReturnItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const { variantMap, transactionSalesId, memberId } =
      await this.validateAndPrepare(data);
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
    const recordedTotalAmount = recordedSubTotalAmount.sub(
      recordedDiscountAmount,
    );

    // Get old item IDs for stock refresh
    const oldItemIds = existing.transactionSalesReturnItems.map(
      (i) => i.masterItemId,
    );

    // Update in transaction (delete items then insert new)
    const salesReturn = await this.prisma.$transaction(async (tx) => {
      // Delete old discounts and items
      await tx.transactionSalesReturnDiscount.deleteMany({
        where: {
          transactionSalesReturnItem: {
            transactionSalesReturnId: id,
          },
        },
      });
      await tx.transactionSalesReturnItem.deleteMany({
        where: { transactionSalesReturnId: id },
      });

      // Update header and create new items (keep original return number)
      const updated = await tx.transactionSalesReturn.update({
        where: { id },
        data: {
          transactionSalesId,
          notes: data.notes || "",
          masterMemberId: memberId,
          branchId: data.branchId,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTotalAmount,
          transactionSalesReturnItems: {
            create: calculatedItems.map((item) => ({
              masterItemId: item.masterItemId,
              masterItemVariantId: item.masterItemVariantId,
              qty: item.qty,
              recordedConversion: item.recordedConversion,
              totalQty: item.totalQty,
              salesPrice: item.salesPrice,
              recordedSubTotalAmount: item.recordedSubTotalAmount,
              recordedDiscountAmount: item.recordedDiscountAmount,
              recordedTotalAmount: item.recordedTotalAmount,
              transactionSalesReturnDiscounts: {
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
          transactionSalesReturnItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_SALES_RETURN,
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
    await Promise.all([
      ...allItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(data.branchId, itemId),
      ),
      ...allItemIds.map((itemId) =>
        this.refreshStockService.refreshFrontStock(data.branchId, itemId),
      ),
    ]);

    // Also refresh old branch if changed
    if (existing.branchId !== data.branchId) {
      await Promise.all([
        ...oldItemIds.map((itemId) =>
          this.refreshStockService.refreshRealStock(existing.branchId, itemId),
        ),
        ...oldItemIds.map((itemId) =>
          this.refreshStockService.refreshFrontStock(existing.branchId, itemId),
        ),
      ]);
    }

    return this.getSalesReturnById(salesReturn.id);
  };

  deleteSalesReturn = async (id: number, userId: number) => {
    const existing = await this.prisma.transactionSalesReturn.findFirst({
      where: { id, deletedAt: null },
      include: { transactionSalesReturnItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Soft delete the sales return
      const result = await tx.transactionSalesReturn.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_SALES_RETURN,
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
    const itemIds = existing.transactionSalesReturnItems.map(
      (i) => i.masterItemId,
    );
    const uniqueItemIds = [...new Set(itemIds)];
    await Promise.all([
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(existing.branchId, itemId),
      ),
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshFrontStock(existing.branchId, itemId),
      ),
    ]);

    return deleted;
  };
}
