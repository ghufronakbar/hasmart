import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RefreshStockService } from "../refresh-stock/refresh-stock.service";
import { TransferBodyType, TransferItemType } from "./transfer.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import {
  Prisma,
  RecordActionModelType,
  RecordActionType,
} from ".prisma/client";
import { BranchQueryType } from "src/middleware/use-branch";

interface CalculatedItem {
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  recordedConversion: number;
  totalQty: number;
}

export class TransferService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshStockService: RefreshStockService,
  ) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Prisma.TransactionTransferWhereInput {
    const where: Prisma.TransactionTransferWhereInput = {
      deletedAt: null,
      AND: [
        {
          OR: filter?.search
            ? [
                { notes: { contains: filter.search, mode: "insensitive" } },
                {
                  from: {
                    name: { contains: filter.search, mode: "insensitive" },
                  },
                },
                {
                  to: {
                    name: { contains: filter.search, mode: "insensitive" },
                  },
                },
              ]
            : undefined,
        },
        branchQuery?.branchId
          ? {
              OR: [
                { fromId: branchQuery?.branchId },
                { toId: branchQuery?.branchId },
              ],
            }
          : {},
      ],
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
  ): Prisma.TransactionTransferFindManyArgs {
    const args: Prisma.TransactionTransferFindManyArgs = {
      where: this.constructWhere(filter, branchQuery),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: this.constructOrder(filter),
      include: {
        from: { select: { id: true, name: true } },
        to: { select: { id: true, name: true } },
        transactionTransferItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: { select: { id: true, unit: true } },
          },
        },
      },
    };
    return args;
  }

  private constructOrder(
    filter?: FilterQueryType,
  ): Prisma.TransactionTransferOrderByWithRelationInput {
    switch (filter?.sortBy) {
      default:
        return filter?.sortBy
          ? { [filter?.sortBy]: filter?.sort }
          : { id: "desc" };
    }
  }

  getAllTransfers = async (
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ) => {
    const [rows, count] = await Promise.all([
      this.prisma.transactionTransfer.findMany(
        this.constructArgs(filter, branchQuery),
      ),
      this.prisma.transactionTransfer.count({
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

  getTransferById = async (id: number) => {
    const data = await this.prisma.transactionTransfer.findFirst({
      where: { id, deletedAt: null },
      include: {
        from: { select: { id: true, name: true } },
        to: { select: { id: true, name: true } },
        transactionTransferItems: {
          where: { deletedAt: null },
          include: {
            masterItem: { select: { id: true, name: true, code: true } },
            masterItemVariant: {
              select: { id: true, unit: true, amount: true },
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

  private async validateAndPrepare(data: TransferBodyType) {
    // Validate unique variant IDs
    const variantIds = data.items.map((item) => item.masterItemVariantId);
    const uniqueVariantIds = [...new Set(variantIds)];
    if (variantIds.length !== uniqueVariantIds.length) {
      throw new BadRequestError("Setiap item variant harus unique");
    }

    // Validate fromId and toId are different (already checked in validator, but double check)
    if (data.fromId === data.toId) {
      throw new BadRequestError(
        "Cabang pengirim dan penerima tidak boleh sama",
      );
    }

    // Validate both branches exist
    const [fromBranch, toBranch] = await Promise.all([
      this.prisma.branch.findFirst({
        where: { id: data.fromId, deletedAt: null },
      }),
      this.prisma.branch.findFirst({
        where: { id: data.toId, deletedAt: null },
      }),
    ]);

    if (!fromBranch) {
      throw new BadRequestError("Cabang pengirim tidak ditemukan");
    }
    if (!toBranch) {
      throw new BadRequestError("Cabang penerima tidak ditemukan");
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
    items: TransferItemType[],
    variantMap: Map<
      number,
      { id: number; masterItemId: number; amount: number }
    >,
  ): CalculatedItem[] {
    return items.map((item) => {
      const variant = variantMap.get(item.masterItemVariantId)!;
      const recordedConversion = variant.amount;
      const totalQty = item.qty * recordedConversion;

      return {
        masterItemId: variant.masterItemId,
        masterItemVariantId: item.masterItemVariantId,
        qty: item.qty,
        recordedConversion,
        totalQty,
      };
    });
  }

  createTransfer = async (data: TransferBodyType, userId: number) => {
    const { variantMap } = await this.validateAndPrepare(data);
    const calculatedItems = this.calculateItems(data.items, variantMap);

    // Create in transaction
    const transfer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transactionTransfer.create({
        data: {
          transactionDate: data.transactionDate,
          fromId: data.fromId,
          toId: data.toId,
          notes: data.notes || "",
          transactionTransferItems: {
            create: calculatedItems.map((item) => ({
              masterItemId: item.masterItemId,
              masterItemVariantId: item.masterItemVariantId,
              qty: item.qty,
              recordedConversion: item.recordedConversion,
              totalQty: item.totalQty,
            })),
          },
        },
        include: {
          transactionTransferItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_TRANSFER,
          modelId: created.id,
          actionType: RecordActionType.CREATE,
          payloadBefore: Prisma.DbNull,
          payloadAfter: created as unknown as Prisma.JsonObject,
          userId,
        },
      });

      return created;
    });

    // Refresh stock for BOTH branches (dual-side)
    const uniqueItemIds = [
      ...new Set(calculatedItems.map((i) => i.masterItemId)),
    ];
    await Promise.all([
      // Refresh sender branch (stock decreases)
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(data.fromId, itemId),
      ),
      // Refresh receiver branch (stock increases)
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(data.toId, itemId),
      ),
    ]);

    return this.getTransferById(transfer.id);
  };

  updateTransfer = async (
    id: number,
    data: TransferBodyType,
    userId: number,
  ) => {
    const existing = await this.prisma.transactionTransfer.findFirst({
      where: { id, deletedAt: null },
      include: { transactionTransferItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const { variantMap } = await this.validateAndPrepare(data);
    const calculatedItems = this.calculateItems(data.items, variantMap);

    // Get old item IDs and branches for stock refresh
    const oldItemIds = existing.transactionTransferItems.map(
      (i) => i.masterItemId,
    );
    const oldFromId = existing.fromId;
    const oldToId = existing.toId;

    // Update in transaction (delete items then insert new)
    const transfer = await this.prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.transactionTransferItem.deleteMany({
        where: { transactionTransferId: id },
      });

      // Update header and create new items
      const updated = await tx.transactionTransfer.update({
        where: { id },
        data: {
          transactionDate: data.transactionDate,
          fromId: data.fromId,
          toId: data.toId,
          notes: data.notes || "",
          transactionTransferItems: {
            create: calculatedItems.map((item) => ({
              masterItemId: item.masterItemId,
              masterItemVariantId: item.masterItemVariantId,
              qty: item.qty,
              recordedConversion: item.recordedConversion,
              totalQty: item.totalQty,
            })),
          },
        },
        include: {
          transactionTransferItems: true,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_TRANSFER,
          modelId: updated.id,
          actionType: RecordActionType.UPDATE,
          payloadBefore: existing as unknown as Prisma.JsonObject,
          payloadAfter: updated as unknown as Prisma.JsonObject,
          userId,
        },
      });

      return updated;
    });

    // Refresh stock for all affected branches and items
    const newItemIds = calculatedItems.map((i) => i.masterItemId);
    const allItemIds = [...new Set([...oldItemIds, ...newItemIds])];

    // Refresh old branches
    await Promise.all([
      ...allItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(oldFromId, itemId),
      ),
      ...allItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(oldToId, itemId),
      ),
    ]);

    // If branches changed, also refresh new branches
    if (oldFromId !== data.fromId || oldToId !== data.toId) {
      await Promise.all([
        ...allItemIds.map((itemId) =>
          this.refreshStockService.refreshRealStock(data.fromId, itemId),
        ),
        ...allItemIds.map((itemId) =>
          this.refreshStockService.refreshRealStock(data.toId, itemId),
        ),
      ]);
    }

    return this.getTransferById(transfer.id);
  };

  deleteTransfer = async (id: number, userId: number) => {
    const existing = await this.prisma.transactionTransfer.findFirst({
      where: { id, deletedAt: null },
      include: { transactionTransferItems: true },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Soft delete the transfer
      const result = await tx.transactionTransfer.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_TRANSFER,
          modelId: id,
          actionType: RecordActionType.DELETE,
          payloadBefore: existing as unknown as Prisma.JsonObject,
          payloadAfter: Prisma.DbNull,
          userId,
        },
      });

      return result;
    });

    // Refresh stock for both branches
    const itemIds = existing.transactionTransferItems.map(
      (i) => i.masterItemId,
    );
    const uniqueItemIds = [...new Set(itemIds)];
    await Promise.all([
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(existing.fromId, itemId),
      ),
      ...uniqueItemIds.map((itemId) =>
        this.refreshStockService.refreshRealStock(existing.toId, itemId),
      ),
    ]);

    return deleted;
  };
}
