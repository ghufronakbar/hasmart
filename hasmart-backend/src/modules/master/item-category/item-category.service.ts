import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ItemCategoryBodyType } from "./item-category.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import { Prisma } from ".prisma/client";

export class ItemCategoryService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
  ): Prisma.MasterItemCategoryWhereInput {
    const where: Prisma.MasterItemCategoryWhereInput = {
      deletedAt: null,
      OR: filter?.search
        ? [
            { name: { startsWith: filter.search, mode: "insensitive" } },
            { code: { startsWith: filter.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    return where;
  }

  private constructArgs(
    filter?: FilterQueryType,
  ): Prisma.MasterItemCategoryFindManyArgs {
    const args: Prisma.MasterItemCategoryFindManyArgs = {
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

  getAllItemCategories = async (filter?: FilterQueryType) => {
    const [rows, count] = await Promise.all([
      this.prisma.masterItemCategory.findMany(this.constructArgs(filter)),
      this.prisma.masterItemCategory.count({
        where: this.constructWhere(filter),
      }),
    ]);

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });
    return { rows, pagination };
  };

  getItemCategoryById = async (id: number) => {
    const data = await this.prisma.masterItemCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return data;
  };

  createItemCategory = async (data: ItemCategoryBodyType) => {
    const upperCode = data.code.toUpperCase();

    // Check if code exists (including soft deleted)
    const existing = await this.prisma.masterItemCategory.findFirst({
      where: { code: upperCode },
    });

    if (existing) {
      if (existing.deletedAt === null) {
        // Code exists and not deleted
        throw new BadRequestError("Kode kategori sudah ada");
      } else {
        // Code exists but deleted - restore it
        return await this.prisma.masterItemCategory.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            deletedAt: null,
          },
        });
      }
    }

    // Create new
    return await this.prisma.masterItemCategory.create({
      data: {
        code: upperCode,
        name: data.name,
      },
    });
  };

  updateItemCategory = async (id: number, data: ItemCategoryBodyType) => {
    const upperCode = data.code.toUpperCase();

    // Check if exists
    const existing = await this.prisma.masterItemCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    // Check if code is used by another record (not deleted)
    const codeCheck = await this.prisma.masterItemCategory.findFirst({
      where: {
        code: upperCode,
        deletedAt: null,
        NOT: { id },
      },
    });
    if (codeCheck) {
      throw new BadRequestError("Kode kategori sudah ada");
    }

    return await this.prisma.masterItemCategory.update({
      where: { id },
      data: {
        code: upperCode,
        name: data.name,
      },
    });
  };

  deleteItemCategory = async (id: number) => {
    const data = await this.prisma.masterItemCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return await this.prisma.masterItemCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  };
}
