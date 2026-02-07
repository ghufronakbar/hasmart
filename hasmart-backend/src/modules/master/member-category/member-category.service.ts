import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MemberCategoryBodyType } from "./member-category.validator";
import { MemberCategoryResponse } from "./member-category.interface";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import { MasterMemberCategory, Prisma } from ".prisma/client";

export class MemberCategoryService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
  ): Prisma.MasterMemberCategoryWhereInput {
    const where: Prisma.MasterMemberCategoryWhereInput = {
      deletedAt: null,
      OR: filter?.search
        ? [
            { name: { contains: filter.search, mode: "insensitive" } },
            { code: { contains: filter.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    return where;
  }

  private constructArgs(
    filter?: FilterQueryType,
  ): Prisma.MasterMemberCategoryFindManyArgs {
    const args: Prisma.MasterMemberCategoryFindManyArgs = {
      where: this.constructWhere(filter),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: filter?.sortBy ? { [filter?.sortBy]: filter?.sort } : undefined,
      include: {
        _count: {
          select: {
            masterMembers: { where: { deletedAt: null } },
          },
        },
      },
    };
    return args;
  }

  private mapToResponse(
    item: MasterMemberCategory & { _count: { masterMembers: number } },
  ): MemberCategoryResponse {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      color: item.color,
      memberCount: item._count?.masterMembers ?? 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  getAllMemberCategories = async (filter?: FilterQueryType) => {
    const [rows, count] = await Promise.all([
      this.prisma.masterMemberCategory.findMany(this.constructArgs(filter)),
      this.prisma.masterMemberCategory.count({
        where: this.constructWhere(filter),
      }),
    ]);

    const mappedRows = rows.map((item) =>
      this.mapToResponse(
        item as MasterMemberCategory & { _count: { masterMembers: number } },
      ),
    );

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });
    return { rows: mappedRows, pagination };
  };

  getMemberCategoryById = async (
    id: number,
  ): Promise<MemberCategoryResponse> => {
    const data = await this.prisma.masterMemberCategory.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            masterMembers: { where: { deletedAt: null } },
          },
        },
      },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return this.mapToResponse(data);
  };

  getMemberCategoryByCode = async (
    code: string,
  ): Promise<MemberCategoryResponse> => {
    const upperCode = code.toUpperCase();
    const data = await this.prisma.masterMemberCategory.findFirst({
      where: { code: upperCode, deletedAt: null },
      include: {
        _count: {
          select: {
            masterMembers: { where: { deletedAt: null } },
          },
        },
      },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return this.mapToResponse(data);
  };

  createMemberCategory = async (data: MemberCategoryBodyType) => {
    const upperCode = data.code.toUpperCase();

    const existing = await this.prisma.masterMemberCategory.findFirst({
      where: { code: upperCode },
    });

    if (existing) {
      if (existing.deletedAt === null) {
        throw new BadRequestError("Kode kategori member sudah ada");
      } else {
        const restored = await this.prisma.masterMemberCategory.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            color: data.color.toUpperCase(),
            deletedAt: null,
          },
          include: {
            _count: {
              select: {
                masterMembers: { where: { deletedAt: null } },
              },
            },
          },
        });
        return this.mapToResponse(restored);
      }
    }

    const created = await this.prisma.masterMemberCategory.create({
      data: {
        code: upperCode,
        name: data.name,
        color: data.color.toUpperCase(),
      },
      include: {
        _count: {
          select: {
            masterMembers: { where: { deletedAt: null } },
          },
        },
      },
    });
    return this.mapToResponse(created);
  };

  updateMemberCategory = async (id: number, data: MemberCategoryBodyType) => {
    const upperCode = data.code.toUpperCase();

    const existing = await this.prisma.masterMemberCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const codeCheck = await this.prisma.masterMemberCategory.findFirst({
      where: {
        code: upperCode,
        deletedAt: null,
        NOT: { id },
      },
    });
    if (codeCheck) {
      throw new BadRequestError("Kode kategori member sudah ada");
    }

    const updated = await this.prisma.masterMemberCategory.update({
      where: { id },
      data: {
        code: upperCode,
        name: data.name,
        color: data.color.toUpperCase(),
      },
      include: {
        _count: {
          select: {
            masterMembers: { where: { deletedAt: null } },
          },
        },
      },
    });
    return this.mapToResponse(updated);
  };

  deleteMemberCategory = async (id: number) => {
    const data = await this.prisma.masterMemberCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return await this.prisma.masterMemberCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  };
}
