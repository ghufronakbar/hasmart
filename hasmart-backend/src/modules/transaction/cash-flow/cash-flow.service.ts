import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CashFlowBodyType } from "./cash-flow.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import {
  Prisma,
  RecordActionModelType,
  RecordActionType,
} from ".prisma/client";
import { BranchQueryType } from "src/middleware/use-branch";

export class CashFlowService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Prisma.TransactionCashFlowWhereInput {
    const where: Prisma.TransactionCashFlowWhereInput = {
      deletedAt: null,
      branchId: branchQuery?.branchId,
      OR: filter?.search
        ? [{ notes: { contains: filter.search, mode: "insensitive" } }]
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
  ): Prisma.TransactionCashFlowFindManyArgs {
    const args: Prisma.TransactionCashFlowFindManyArgs = {
      where: this.constructWhere(filter, branchQuery),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: this.constructOrder(filter),
      include: {
        branch: { select: { id: true, name: true } },
      },
    };
    return args;
  }

  private constructOrder(
    filter?: FilterQueryType,
  ): Prisma.TransactionCashFlowOrderByWithRelationInput | undefined {
    return filter?.sortBy ? { [filter?.sortBy]: filter?.sort } : { id: "desc" };
  }

  getAllCashFlows = async (
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ) => {
    const [rows, count] = await Promise.all([
      this.prisma.transactionCashFlow.findMany(
        this.constructArgs(filter, branchQuery),
      ),
      this.prisma.transactionCashFlow.count({
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

  getCashFlowById = async (id: number) => {
    const data = await this.prisma.transactionCashFlow.findFirst({
      where: { id, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return data;
  };

  createCashFlow = async (data: CashFlowBodyType, userId: number) => {
    // Validate branch exists
    const branch = await this.prisma.branch.findFirst({
      where: { id: data.branchId, deletedAt: null },
    });
    if (!branch) {
      throw new BadRequestError("Cabang tidak ditemukan");
    }

    const cashFlow = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transactionCashFlow.create({
        data: {
          branchId: data.branchId,
          notes: data.notes,
          amount: data.amount,
          type: data.type,
          transactionDate: data.transactionDate,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_CASH_FLOW,
          modelId: created.id,
          actionType: RecordActionType.CREATE,
          payloadBefore: Prisma.DbNull,
          payloadAfter: created as unknown as Prisma.JsonObject,
          userId,
        },
      });

      return created;
    });

    return this.getCashFlowById(cashFlow.id);
  };

  updateCashFlow = async (
    id: number,
    data: CashFlowBodyType,
    userId: number,
  ) => {
    const existing = await this.prisma.transactionCashFlow.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const cashFlow = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.transactionCashFlow.update({
        where: { id },
        data: {
          branchId: data.branchId,
          notes: data.notes,
          amount: data.amount,
          type: data.type,
          transactionDate: data.transactionDate,
        },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_CASH_FLOW,
          modelId: updated.id,
          actionType: RecordActionType.UPDATE,
          payloadBefore: existing as unknown as Prisma.JsonObject,
          payloadAfter: updated as unknown as Prisma.JsonObject,
          userId,
        },
      });

      return updated;
    });

    return this.getCashFlowById(cashFlow.id);
  };

  deleteCashFlow = async (id: number, userId: number) => {
    const existing = await this.prisma.transactionCashFlow.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Soft delete
      const result = await tx.transactionCashFlow.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Record action
      await tx.recordAction.create({
        data: {
          modelType: RecordActionModelType.TRANSACTION_CASH_FLOW,
          modelId: id,
          actionType: RecordActionType.DELETE,
          payloadBefore: existing as unknown as Prisma.JsonObject,
          payloadAfter: Prisma.DbNull,
          userId,
        },
      });

      return result;
    });

    return deleted;
  };
}
