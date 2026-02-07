import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { UnitBodyType } from "./unit.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import { Prisma } from ".prisma/client";

export class UnitService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
  ): Prisma.MasterUnitWhereInput {
    const where: Prisma.MasterUnitWhereInput = {
      deletedAt: null,
      OR: filter?.search
        ? [
            { unit: { contains: filter.search, mode: "insensitive" } },
            { name: { contains: filter.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    return where;
  }

  private constructArgs(
    filter?: FilterQueryType,
  ): Prisma.MasterUnitFindManyArgs {
    const args: Prisma.MasterUnitFindManyArgs = {
      where: this.constructWhere(filter),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: filter?.sortBy ? { [filter?.sortBy]: filter?.sort } : undefined,
    };
    return args;
  }

  getAllUnits = async (filter?: FilterQueryType) => {
    const [rows, count] = await Promise.all([
      this.prisma.masterUnit.findMany(this.constructArgs(filter)),
      this.prisma.masterUnit.count({ where: this.constructWhere(filter) }),
    ]);

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });
    return { rows, pagination };
  };

  getUnitById = async (id: number) => {
    const data = await this.prisma.masterUnit.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return data;
  };

  createUnit = async (data: UnitBodyType) => {
    const upperUnit = data.unit.toUpperCase();

    const existing = await this.prisma.masterUnit.findFirst({
      where: { unit: upperUnit },
    });

    if (existing) {
      if (existing.deletedAt === null) {
        throw new BadRequestError("Unit sudah ada");
      } else {
        return await this.prisma.masterUnit.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            deletedAt: null,
          },
        });
      }
    }

    return await this.prisma.masterUnit.create({
      data: {
        unit: upperUnit,
        name: data.name,
      },
    });
  };

  updateUnit = async (id: number, data: UnitBodyType) => {
    const upperUnit = data.unit.toUpperCase();

    const existing = await this.prisma.masterUnit.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const unitCheck = await this.prisma.masterUnit.findFirst({
      where: {
        unit: upperUnit,
        deletedAt: null,
        NOT: { id },
      },
    });
    if (unitCheck) {
      throw new BadRequestError("Unit sudah ada");
    }

    return await this.prisma.masterUnit.update({
      where: { id },
      data: {
        unit: upperUnit,
        name: data.name,
      },
    });
  };

  deleteUnit = async (id: number) => {
    const data = await this.prisma.masterUnit.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return await this.prisma.masterUnit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  };
}
