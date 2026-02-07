import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RefreshStockService } from "../refresh-stock/refresh-stock.service";
import { SalesBodyType, SalesItemType } from "./sales.validator";
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
  recordedBuyPrice: Decimal;
  discounts: CalculatedDiscount[];
}

export class SalesService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshStockService: RefreshStockService,
  ) {
    super();
  }

  /**
   * Generate invoice number with format: TS-{YYYYMMDD}-{SEQUENCE}
   */
  private async generateInvoiceNumber(branchId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `TS-${dateStr}`;

    // Get the last invoice of today
    const lastSales = await this.prisma.transactionSales.findFirst({
      where: {
        invoiceNumber: { startsWith: prefix },
        branchId,
      },
      orderBy: { invoiceNumber: "desc" },
    });

    let sequence = 1;
    if (lastSales) {
      const lastSequence = parseInt(lastSales.invoiceNumber.split("-")[2], 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(4, "0")}`;
  }

  private constructWhere(
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Prisma.TransactionSalesWhereInput {
    const where: Prisma.TransactionSalesWhereInput = {
      deletedAt: null,
      branchId: branchQuery?.branchId,
      OR: filter?.search
        ? [
            { invoiceNumber: { contains: filter.search, mode: "insensitive" } },
            { notes: { contains: filter.search, mode: "insensitive" } },
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
  ): Prisma.TransactionSalesFindManyArgs {
    const args: Prisma.TransactionSalesFindManyArgs = {
      where: this.constructWhere(filter, branchQuery),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: this.constructOrder(filter),
      include: {
        masterMember: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true } },
        transactionSalesItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: { select: { id: true, unit: true } },
            transactionSalesDiscounts: {
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
  ): Prisma.TransactionSalesOrderByWithRelationInput | undefined {
    switch (filter?.sortBy) {
      case "masterMember_name":
        return {
          masterMember: {
            name: filter?.sort,
          },
        };
      default:
        return filter?.sortBy
          ? { [filter?.sortBy]: filter?.sort }
          : { id: "desc" };
    }
  }

  getAllSales = async (
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ) => {
    const [rows, count] = await Promise.all([
      this.prisma.transactionSales.findMany(
        this.constructArgs(filter, branchQuery),
      ),
      this.prisma.transactionSales.count({
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

  getSalesById = async (id: number) => {
    const data = await this.prisma.transactionSales.findFirst({
      where: { id, deletedAt: null },
      include: {
        masterMember: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true } },
        transactionSalesItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: {
              select: { id: true, unit: true, amount: true },
            },
            transactionSalesDiscounts: {
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

  getSalesByInvoice = async (invoiceNumber: string) => {
    const data = await this.prisma.transactionSales.findFirst({
      where: {
        invoiceNumber: { equals: invoiceNumber, mode: "insensitive" },
        deletedAt: null,
      },
      include: {
        masterMember: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true } },
        transactionSalesItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: {
              select: { id: true, unit: true, amount: true },
            },
            transactionSalesDiscounts: {
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

  private async validateAndPrepare(data: SalesBodyType) {
    // Validate unique variant IDs
    const variantIds = data.items.map((item) => item.masterItemVariantId);
    const uniqueVariantIds = [...new Set(variantIds)];
    if (variantIds.length !== uniqueVariantIds.length) {
      throw new BadRequestError("Setiap item variant harus unique");
    }

    // Validate branch exists
    const branch = await this.prisma.branch.findFirst({
      where: { id: data.branchId, deletedAt: null },
    });
    if (!branch) {
      throw new BadRequestError("Cabang tidak ditemukan");
    }

    // Validate and resolve member by code if provided
    let memberId: number | null = null;
    if (data.memberCode) {
      const member = await this.prisma.masterMember.findFirst({
        where: { code: data.memberCode, deletedAt: null },
      });
      if (!member) {
        throw new BadRequestError(
          "Member dengan kode tersebut tidak ditemukan",
        );
      }
      memberId = member.id;
    }

    // Validate all variants exist and get conversion
    const variants = await this.prisma.masterItemVariant.findMany({
      where: {
        id: { in: uniqueVariantIds },
        deletedAt: null,
        masterItem: { deletedAt: null },
      },
      select: {
        id: true,
        masterItemId: true,
        amount: true,
        sellPrice: true,
        masterItem: {
          select: {
            recordedBuyPrice: true,
          },
        },
      },
    });

    if (variants.length !== uniqueVariantIds.length) {
      throw new BadRequestError("Beberapa variant tidak ditemukan");
    }

    // Create variant map for quick lookup
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return { variantMap, memberId, variants };
  }

  private calculateItems(
    items: SalesItemType[],
    variantMap: Map<
      number,
      {
        id: number;
        masterItemId: number;
        amount: number;
        sellPrice: Decimal;
        masterItem: {
          recordedBuyPrice: Decimal;
        };
      }
    >,
  ): CalculatedItem[] {
    return items.map((item) => {
      const variant = variantMap.get(item.masterItemVariantId)!;
      const recordedConversion = variant.amount;
      const totalQty = item.qty * recordedConversion;
      // Decimal: qty * sellPrice
      const recordedSubTotalAmount = variant.sellPrice.mul(item.qty);

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

      const recordedBuyPrice = variant.masterItem.recordedBuyPrice;

      return {
        masterItemId: variant.masterItemId,
        masterItemVariantId: item.masterItemVariantId,
        qty: item.qty,
        recordedConversion,
        totalQty,
        salesPrice: variant.sellPrice,
        recordedSubTotalAmount,
        recordedDiscountAmount: totalDiscountAmount,
        recordedTotalAmount,
        discounts,
        recordedBuyPrice,
      };
    });
  }

  createSales = async (data: SalesBodyType, userId: number) => {
    const { variantMap, memberId } = await this.validateAndPrepare(data);
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

    const cashChange = data.cashReceived.sub(recordedTotalAmount);

    if (cashChange.lt(0)) {
      throw new BadRequestError("Uang yang diterima kurang");
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(data.branchId);

    // Create in transaction
    const sales = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transactionSales.create({
        data: {
          invoiceNumber,
          notes: data.notes || "",
          masterMemberId: memberId,
          branchId: data.branchId,
          cashReceived: data.cashReceived,
          cashChange,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTotalAmount,
          paymentType: data.paymentType,
          // TODO: ganti kalau bisa custom
          transactionDate: new Date(),
          transactionSalesItems: {
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
              recordedBuyPrice: item.recordedBuyPrice,
              transactionSalesDiscounts: {
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
          transactionSalesItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_SALES,
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

    return this.getSalesById(sales.id);
  };

  updateSales = async (id: number, data: SalesBodyType, userId: number) => {
    const existing = await this.prisma.transactionSales.findFirst({
      where: { id, deletedAt: null },
      include: { transactionSalesItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const { variantMap, memberId } = await this.validateAndPrepare(data);
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

    const cashChange = data.cashReceived.sub(recordedTotalAmount);

    if (cashChange.lt(0)) {
      throw new BadRequestError("Uang yang diterima kurang");
    }

    // Get old item IDs for stock refresh
    const oldItemIds = existing.transactionSalesItems.map(
      (i) => i.masterItemId,
    );

    // Update in transaction (delete items then insert new)
    const sales = await this.prisma.$transaction(async (tx) => {
      // Delete old discounts and items
      await tx.transactionSalesDiscount.deleteMany({
        where: {
          transactionSalesItem: {
            transactionSalesId: id,
          },
        },
      });
      await tx.transactionSalesItem.deleteMany({
        where: { transactionSalesId: id },
      });

      // Update header and create new items (keep original invoice number)
      const updated = await tx.transactionSales.update({
        where: { id },
        data: {
          notes: data.notes || "",
          masterMemberId: memberId,
          branchId: data.branchId,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTotalAmount,
          cashReceived: data.cashReceived,
          cashChange,
          paymentType: data.paymentType,
          transactionSalesItems: {
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
              recordedBuyPrice: item.recordedBuyPrice,
              transactionSalesDiscounts: {
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
          transactionSalesItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_SALES,
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

    return this.getSalesById(sales.id);
  };

  deleteSales = async (id: number, userId: number) => {
    const existing = await this.prisma.transactionSales.findFirst({
      where: { id, deletedAt: null },
      include: { transactionSalesItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Soft delete the sales
      const result = await tx.transactionSales.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_SALES,
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
    const itemIds = existing.transactionSalesItems.map((i) => i.masterItemId);
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
