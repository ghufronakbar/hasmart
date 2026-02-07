import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../../modules/common/prisma/prisma.service";
import { BranchBodyType } from "./brach.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import { Prisma } from ".prisma/client";

export class BranchService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private constructWhere(filter?: FilterQueryType): Prisma.BranchWhereInput {
    const where: Prisma.BranchWhereInput = {
      deletedAt: null,
      OR: filter?.search
        ? [
            { name: { contains: filter.search, mode: "insensitive" } },
            { code: { contains: filter.search, mode: "insensitive" } },
            { address: { contains: filter.search, mode: "insensitive" } },
            { phone: { contains: filter.search, mode: "insensitive" } },
            { email: { contains: filter.search, mode: "insensitive" } },
            { fax: { contains: filter.search, mode: "insensitive" } },
            { npwp: { contains: filter.search, mode: "insensitive" } },
            { ownerName: { contains: filter.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    return where;
  }

  private constructArgs(filter?: FilterQueryType): Prisma.BranchFindManyArgs {
    const args: Prisma.BranchFindManyArgs = {
      where: this.constructWhere(filter),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: filter?.sortBy
        ? {
            [filter?.sortBy]: filter?.sort,
          }
        : undefined,
    };

    return args;
  }

  getAllBranches = async (filter?: FilterQueryType) => {
    const [rows, count] = await Promise.all([
      this.prisma.branch.findMany(this.constructArgs(filter)),
      this.prisma.branch.count({ where: this.constructWhere(filter) }),
    ]);

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });
    return { rows, pagination };
  };

  getBranchById = async (id: number) => {
    const branch = await this.prisma.branch.findFirst({
      where: { id, deletedAt: null },
    });
    if (!branch) {
      throw new NotFoundError();
    }
    return branch;
  };

  createBranch = async (data: BranchBodyType) => {
    const checkCode = await this.prisma.branch.findUnique({
      where: { code: data.code?.toUpperCase() },
    });
    if (checkCode) {
      throw new BadRequestError("Kode cabang sudah ada");
    }
    return await this.prisma.branch.create({ data });
  };

  updateBranch = async (id: number, data: BranchBodyType) => {
    const checkCode = await this.prisma.branch.findUnique({
      where: { code: data.code?.toUpperCase() },
    });
    if (checkCode && checkCode.id !== id) {
      throw new BadRequestError("Kode cabang sudah ada");
    }
    return await this.prisma.branch.update({
      where: { id },
      data: { ...data, code: data.code?.toUpperCase() },
    });
  };

  deleteBranch = async (id: number) => {
    const branch = await this.prisma.branch.findFirst({
      where: { id, deletedAt: null },
    });
    if (!branch) {
      throw new NotFoundError();
    }
    return await this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  };
}
