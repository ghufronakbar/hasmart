import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RefreshStockService } from "../refresh-stock/refresh-stock.service";
import {
  AdjustmentBodyType,
  AdjustmentItemType,
} from "./adjust-stock.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import {
  Prisma,
  RecordActionModelType,
  RecordActionType,
} from ".prisma/client";
import { BranchQueryType } from "src/middleware/use-branch";

interface CalculatedAdjustment {
  masterItemId: number;
  masterItemVariantId: number;
  beforeAmount: number;
  beforeTotalAmount: number;
  recordedGapConversion: number;
  totalGapAmount: number;
  finalAmount: number;
  finalTotalAmount: number;
  inputAmount: number;
}

export class AdjustStockService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshStockService: RefreshStockService,
  ) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Prisma.TransactionAdjustmentWhereInput {
    const where: Prisma.TransactionAdjustmentWhereInput = {
      deletedAt: null,
      OR: filter?.search
        ? [
            { notes: { contains: filter.search, mode: "insensitive" } },
            {
              masterItem: {
                code: { contains: filter.search, mode: "insensitive" },
              },
            },
            {
              masterItem: {
                name: { contains: filter.search, mode: "insensitive" },
              },
            },
          ]
        : undefined,
      branchId: branchQuery?.branchId,
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
  ): Prisma.TransactionAdjustmentFindManyArgs {
    const args: Prisma.TransactionAdjustmentFindManyArgs = {
      where: this.constructWhere(filter, branchQuery),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: this.constructOrder(filter),
      include: {
        branch: { select: { id: true, name: true } },
        masterItem: { select: { id: true, name: true, code: true } },
        masterItemVariant: { select: { id: true, unit: true } },
      },
    };
    return args;
  }

  private constructOrder(
    filter?: FilterQueryType,
  ): Prisma.TransactionAdjustmentOrderByWithRelationInput | undefined {
    switch (filter?.sortBy) {
      case "masterItem_name":
        return {
          masterItem: {
            name: filter?.sort,
          },
        };
      default:
        return filter?.sortBy
          ? { [filter?.sortBy]: filter?.sort }
          : { id: "desc" };
    }
  }

  getAllAdjustments = async (
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ) => {
    const [rows, count] = await Promise.all([
      this.prisma.transactionAdjustment.findMany(
        this.constructArgs(filter, branchQuery),
      ),
      this.prisma.transactionAdjustment.count({
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

  getAdjustmentById = async (id: number) => {
    const data = await this.prisma.transactionAdjustment.findFirst({
      where: { id, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true } },
        masterItem: { select: { id: true, name: true, code: true } },
        masterItemVariant: {
          select: { id: true, unit: true, amount: true },
        },
      },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return data;
  };

  private async validateAndPrepare(data: AdjustmentBodyType) {
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

    // validate unique masterItemId
    const itemIds = Array.from(new Set(variants.map((v) => v.masterItemId)));
    if (itemIds.length !== variants.length) {
      throw new BadRequestError("Setiap masterItemId harus unique");
    }

    // Get current stock for all items
    const currentStocks = await this.prisma.itemBranch.findMany({
      where: {
        branchId: data.branchId,
        masterItemId: { in: itemIds },
      },
      select: { masterItemId: true, recordedStock: true },
    });

    // Create stock map (default to 0 if not found)
    const stockMap = new Map(
      currentStocks.map((s) => [s.masterItemId, s.recordedStock]),
    );

    return { variantMap, stockMap };
  }

  private calculateAdjustments(
    items: AdjustmentItemType[],
    variantMap: Map<
      number,
      { id: number; masterItemId: number; amount: number }
    >,
    stockMap: Map<number, number>,
  ): CalculatedAdjustment[] {
    const adjustments: CalculatedAdjustment[] = [];

    // Group items by masterItemId
    const itemsByMaster = new Map<number, AdjustmentItemType[]>();
    for (const item of items) {
      const variant = variantMap.get(item.masterItemVariantId);
      if (!variant) {
        throw new BadRequestError("Variant tidak ditemukan");
      }
      const existing = itemsByMaster.get(variant.masterItemId) || [];
      existing.push(item);
      itemsByMaster.set(variant.masterItemId, existing);
    }

    // Calculate adjustments per masterItemId
    for (const [masterItemId, itemGroup] of itemsByMaster) {
      // Calculate total actual stock (sum of all variants)
      const totalActualStock = itemGroup.reduce((sum, item) => {
        const variant = variantMap.get(item.masterItemVariantId);
        if (!variant) {
          throw new BadRequestError("Variant tidak ditemukan");
        }
        return sum + item.actualQty * variant.amount;
      }, 0);

      // Get current stock
      const currentStock = stockMap.get(masterItemId) || 0;

      // Calculate total gap
      const totalGapAmount = totalActualStock - currentStock;

      // Skip if no gap
      if (totalGapAmount === 0) {
        continue;
      }

      // Create adjustment for each variant
      for (const item of itemGroup) {
        const variant = variantMap.get(item.masterItemVariantId);
        if (!variant) {
          throw new BadRequestError("Variant tidak ditemukan");
        }
        const recordedGapConversion = variant.amount;
        const beforeTotalAmount = currentStock * recordedGapConversion;
        const finalTotalAmount = item.actualQty * recordedGapConversion;

        adjustments.push({
          masterItemId: variant.masterItemId,
          masterItemVariantId: item.masterItemVariantId,
          beforeAmount: currentStock,
          beforeTotalAmount,
          recordedGapConversion,
          totalGapAmount, // Same for all variants of this item
          finalAmount: item.actualQty,
          finalTotalAmount,
          inputAmount: item.actualQty,
        });
      }
    }

    return adjustments;
  }

  createAdjustment = async (data: AdjustmentBodyType, userId: number) => {
    const { variantMap, stockMap } = await this.validateAndPrepare(data);
    const calculatedAdjustments = this.calculateAdjustments(
      data.items,
      variantMap,
      stockMap,
    );

    // If no adjustments needed (all stock matches), return early
    if (calculatedAdjustments.length === 0) {
      throw new BadRequestError(
        "Tidak ada penyesuaian yang diperlukan. Semua stok sudah sesuai dengan jumlah fisik.",
      );
    }

    // Create adjustments in transaction
    const createdAdjustments = await this.prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        calculatedAdjustments.map((adj) =>
          tx.transactionAdjustment.create({
            data: {
              branchId: data.branchId,
              notes: data.notes || "",
              masterItemId: adj.masterItemId,
              masterItemVariantId: adj.masterItemVariantId,
              inputAmount: adj.inputAmount,
              recordedGapConversion: adj.recordedGapConversion,
              transactionDate: data.transactionDate,
              totalGapAmount: adj.totalGapAmount,
              finalAmount: adj.finalAmount,
              beforeAmount: adj.beforeAmount,
              beforeTotalAmount: adj.beforeTotalAmount,
              finalTotalAmount: adj.finalTotalAmount,
            },
          }),
        ),
      );

      // Record action for each adjustment
      await Promise.all(
        created.map((adj) =>
          tx.recordAction.create({
            data: {
              modelType: RecordActionModelType.TRANSACTION_ADJUSTMENT,
              modelId: adj.id,
              actionType: RecordActionType.CREATE,
              payloadBefore: Prisma.DbNull,
              payloadAfter: adj as unknown as Prisma.JsonObject,
              userId,
            },
          }),
        ),
      );

      return created;
    });

    // Refresh stock for all adjusted items
    const uniqueItemIds = [
      ...new Set(calculatedAdjustments.map((a) => a.masterItemId)),
    ];
    await Promise.all([
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(data.branchId, itemId),
      ),
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshFrontStock(data.branchId, itemId),
      ),
    ]);

    // Return all created adjustments
    return Promise.all(
      createdAdjustments.map((adj) => this.getAdjustmentById(adj.id)),
    );
  };

  deleteAdjustment = async (id: number, userId: number) => {
    const existing = await this.prisma.transactionAdjustment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Soft delete the adjustment
      const result = await tx.transactionAdjustment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_ADJUSTMENT,
          modelId: id,
          actionType: RecordActionType.DELETE,
          payloadBefore: existing as unknown as Prisma.JsonObject,
          payloadAfter: Prisma.DbNull,
          userId,
        },
      });

      return result;
    });

    // Refresh stock
    await this.refreshStockService.refreshRealStock(
      existing.branchId,
      existing.masterItemId,
    );
    await this.refreshStockService.refreshFrontStock(
      existing.branchId,
      existing.masterItemId,
    );

    return deleted;
  };
}
