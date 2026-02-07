import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { SupplierBodyType } from "./supplier.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import { Prisma } from ".prisma/client";

export class SupplierService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
  ): Prisma.MasterSupplierWhereInput {
    const where: Prisma.MasterSupplierWhereInput = {
      deletedAt: null,
      OR: filter?.search
        ? [
            { name: { startsWith: filter.search, mode: "insensitive" } },
            { code: { startsWith: filter.search, mode: "insensitive" } },
            { phone: { startsWith: filter.search, mode: "insensitive" } },
            { email: { startsWith: filter.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    return where;
  }

  private constructArgs(
    filter?: FilterQueryType,
  ): Prisma.MasterSupplierFindManyArgs {
    const args: Prisma.MasterSupplierFindManyArgs = {
      where: this.constructWhere(filter),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: filter?.sortBy ? { [filter?.sortBy]: filter?.sort } : undefined,
    };
    return args;
  }

  getAllSuppliers = async (filter?: FilterQueryType) => {
    const [rows, count] = await Promise.all([
      this.prisma.masterSupplier.findMany(this.constructArgs(filter)),
      this.prisma.masterSupplier.count({ where: this.constructWhere(filter) }),
    ]);

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });
    return { rows, pagination };
  };

  getSupplierById = async (id: number) => {
    const data = await this.prisma.masterSupplier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return data;
  };

  createSupplier = async (data: SupplierBodyType) => {
    const upperCode = data.code.toUpperCase();

    const existing = await this.prisma.masterSupplier.findFirst({
      where: { code: upperCode },
    });

    if (existing) {
      if (existing.deletedAt === null) {
        throw new BadRequestError("Kode supplier sudah ada");
      } else {
        return await this.prisma.masterSupplier.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            phone: data.phone,
            address: data.address,
            email: data.email,
            deletedAt: null,
          },
        });
      }
    }

    return await this.prisma.masterSupplier.create({
      data: {
        code: upperCode,
        name: data.name,
        phone: data.phone,
        address: data.address,
        email: data.email,
      },
    });
  };

  updateSupplier = async (id: number, data: SupplierBodyType) => {
    const upperCode = data.code.toUpperCase();

    const existing = await this.prisma.masterSupplier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    const codeCheck = await this.prisma.masterSupplier.findFirst({
      where: {
        code: upperCode,
        deletedAt: null,
        NOT: { id },
      },
    });
    if (codeCheck) {
      throw new BadRequestError("Kode supplier sudah ada");
    }

    return await this.prisma.masterSupplier.update({
      where: { id },
      data: {
        code: upperCode,
        name: data.name,
        phone: data.phone,
        address: data.address,
        email: data.email,
      },
    });
  };

  deleteSupplier = async (id: number) => {
    const data = await this.prisma.masterSupplier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return await this.prisma.masterSupplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  };
}
