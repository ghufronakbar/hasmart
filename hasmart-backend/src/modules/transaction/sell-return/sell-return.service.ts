import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RefreshStockService } from "../refresh-stock/refresh-stock.service";
import {
  SellReturnBodyType,
  SellReturnItemType,
} from "./sell-return.validator";
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
  sellPrice: Decimal;
  recordedSubTotalAmount: Decimal;
  recordedDiscountAmount: Decimal;
  recordedTotalAmount: Decimal;
  discounts: CalculatedDiscount[];
}

export class SellReturnService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshStockService: RefreshStockService,
  ) {
    super();
  }

  /**
   * Generate return number with format: RTG-{YYYYMMDD}-{SEQUENCE}
   */
  private async generateReturnNumber(branchId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `RTG-${dateStr}`;

    // Get the last return number of today
    const lastReturn = await this.prisma.transactionSellReturn.findFirst({
      where: {
        invoiceNumber: { startsWith: prefix },
        branchId,
      },
      orderBy: { invoiceNumber: "desc" },
    });

    let sequence = 1;
    if (lastReturn) {
      const lastSequence = parseInt(lastReturn.invoiceNumber.split("-")[2], 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(4, "0")}`;
  }

  private constructWhere(
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Prisma.TransactionSellReturnWhereInput {
    const where: Prisma.TransactionSellReturnWhereInput = {
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

      if (filter.dateEnd && filter.dateEnd !== filter.dateStart) {
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
  ): Prisma.TransactionSellReturnFindManyArgs {
    const args: Prisma.TransactionSellReturnFindManyArgs = {
      where: this.constructWhere(filter, branchQuery),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: this.constructOrder(filter),
      include: {
        masterMember: { select: { id: true, code: true, name: true } },
        transactionSell: { select: { id: true, invoiceNumber: true } },
        branch: { select: { id: true, name: true } },
        transactionSellReturnItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: { select: { id: true, unit: true } },
            transactionSellReturnDiscounts: {
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
  ): Prisma.TransactionSellReturnOrderByWithRelationInput {
    switch (filter?.sortBy) {
      case "masterMemberName":
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

  getAllSellReturns = async (
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ) => {
    const [rows, count] = await Promise.all([
      this.prisma.transactionSellReturn.findMany(
        this.constructArgs(filter, branchQuery),
      ),
      this.prisma.transactionSellReturn.count({
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

  getSellReturnById = async (id: number) => {
    const data = await this.prisma.transactionSellReturn.findFirst({
      where: { id, deletedAt: null },
      include: {
        masterMember: { select: { id: true, code: true, name: true } },
        transactionSell: { select: { id: true, invoiceNumber: true } },
        branch: { select: { id: true, name: true } },
        transactionSellReturnItems: {
          where: { deletedAt: null },
          include: {
            masterItem: {
              select: {
                id: true,
                name: true,
                code: true,
                masterItemVariants: {
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
            transactionSellReturnDiscounts: {
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

  private async validateAndPrepare(data: SellReturnBodyType) {
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

    // Validate and resolve member by code (MANDATORY for B2B)
    const member = await this.prisma.masterMember.findFirst({
      where: { code: data.memberCode, deletedAt: null },
    });
    if (!member) {
      throw new BadRequestError("Member dengan kode tersebut tidak ditemukan");
    }

    // Validate all variants exist and get conversion
    const variants = await this.prisma.masterItemVariant.findMany({
      where: {
        id: { in: uniqueVariantIds },
        deletedAt: null,
        masterItem: {
          deletedAt: null,
        },
      },
      select: { id: true, masterItemId: true, amount: true },
    });

    if (variants.length !== uniqueVariantIds.length) {
      throw new BadRequestError("Beberapa variant tidak ditemukan");
    }

    // Create variant map for quick lookup
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return { variantMap, memberId: member.id };
  }

  private calculateItems(
    items: SellReturnItemType[],
    variantMap: Map<
      number,
      { id: number; masterItemId: number; amount: number }
    >,
  ): CalculatedItem[] {
    return items.map((item) => {
      const variant = variantMap.get(item.masterItemVariantId)!;
      const recordedConversion = variant.amount;
      const totalQty = item.qty * recordedConversion;
      // Decimal: qty * sellPrice
      const recordedSubTotalAmount = item.sellPrice.mul(item.qty);

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
        sellPrice: item.sellPrice,
        recordedSubTotalAmount,
        recordedDiscountAmount: totalDiscountAmount,
        recordedTotalAmount,
        discounts,
      };
    });
  }

  createSellReturn = async (data: SellReturnBodyType, userId: number) => {
    const { variantMap, memberId } = await this.validateAndPrepare(data);

    // Validate original invoice
    const originalInvoice = await this.prisma.transactionSell.findFirst({
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

    // Calculate tax with Decimal
    const taxBase = recordedSubTotalAmount.sub(recordedDiscountAmount);
    const recordedTaxAmount = taxBase
      .mul(data.taxPercentage || new Decimal(0))
      .div(100);
    const recordedTotalAmount = taxBase.add(recordedTaxAmount);

    // Generate return number
    const invoiceNumber = await this.generateReturnNumber(data.branchId);

    // Create in transaction
    const sellReturn = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transactionSellReturn.create({
        data: {
          invoiceNumber,
          transactionSellId: originalInvoice.id,
          transactionDate: data.transactionDate,
          dueDate: data.dueDate,
          notes: data.notes || "",
          masterMemberId: memberId,
          branchId: data.branchId,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTaxPercentage: data.taxPercentage || 0,
          recordedTaxAmount,
          recordedTotalAmount,
          transactionSellReturnItems: {
            create: calculatedItems.map((item) => ({
              masterItemId: item.masterItemId,
              masterItemVariantId: item.masterItemVariantId,
              qty: item.qty,
              recordedConversion: item.recordedConversion,
              totalQty: item.totalQty,
              sellPrice: item.sellPrice,
              recordedSubTotalAmount: item.recordedSubTotalAmount,
              recordedDiscountAmount: item.recordedDiscountAmount,
              recordedTotalAmount: item.recordedTotalAmount,
              transactionSellReturnDiscounts: {
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
          transactionSellReturnItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_SELL_RETURN,
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

    return this.getSellReturnById(sellReturn.id);
  };

  updateSellReturn = async (
    id: number,
    data: SellReturnBodyType,
    userId: number,
  ) => {
    const existing = await this.prisma.transactionSellReturn.findFirst({
      where: { id, deletedAt: null },
      include: { transactionSellReturnItems: true },
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

    // Calculate tax with Decimal
    const taxBase = recordedSubTotalAmount.sub(recordedDiscountAmount);
    const recordedTaxAmount = taxBase
      .mul(data.taxPercentage || new Decimal(0))
      .div(100);
    const recordedTotalAmount = taxBase.add(recordedTaxAmount);

    // Get old item IDs for stock refresh
    const oldItemIds = existing.transactionSellReturnItems.map(
      (i) => i.masterItemId,
    );

    // Update in transaction (delete items then insert new)
    const sellReturn = await this.prisma.$transaction(async (tx) => {
      // Delete old discounts and items
      await tx.transactionSellReturnDiscount.deleteMany({
        where: {
          transactionSellReturnItem: {
            transactionSellReturnId: id,
          },
        },
      });
      await tx.transactionSellReturnItem.deleteMany({
        where: { transactionSellReturnId: id },
      });

      // Update header and create new items (keep original invoice number)
      const updated = await tx.transactionSellReturn.update({
        where: { id },
        data: {
          transactionDate: data.transactionDate,
          dueDate: data.dueDate,
          notes: data.notes || "",
          masterMemberId: memberId,
          branchId: data.branchId,
          recordedSubTotalAmount,
          recordedDiscountAmount,
          recordedTaxPercentage: data.taxPercentage || 0,
          recordedTaxAmount,
          recordedTotalAmount,
          transactionSellReturnItems: {
            create: calculatedItems.map((item) => ({
              masterItemId: item.masterItemId,
              masterItemVariantId: item.masterItemVariantId,
              qty: item.qty,
              recordedConversion: item.recordedConversion,
              totalQty: item.totalQty,
              sellPrice: item.sellPrice,
              recordedSubTotalAmount: item.recordedSubTotalAmount,
              recordedDiscountAmount: item.recordedDiscountAmount,
              recordedTotalAmount: item.recordedTotalAmount,
              transactionSellReturnDiscounts: {
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
          transactionSellReturnItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_SELL_RETURN,
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

    return this.getSellReturnById(sellReturn.id);
  };

  deleteSellReturn = async (id: number, userId: number) => {
    const existing = await this.prisma.transactionSellReturn.findFirst({
      where: { id, deletedAt: null },
      include: { transactionSellReturnItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Soft delete the sell return
      const result = await tx.transactionSellReturn.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_SELL_RETURN,
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
    const itemIds = existing.transactionSellReturnItems.map(
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
