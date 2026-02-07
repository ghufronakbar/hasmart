import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MemberBodyType } from "./member.validator";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import { Prisma } from ".prisma/client";

export class MemberService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private constructWhere(
    filter?: FilterQueryType,
  ): Prisma.MasterMemberWhereInput {
    const where: Prisma.MasterMemberWhereInput = {
      deletedAt: null,
      OR: filter?.search
        ? [
            { name: { contains: filter.search, mode: "insensitive" } },
            { code: { contains: filter.search, mode: "insensitive" } },
            { phone: { contains: filter.search, mode: "insensitive" } },
            { email: { contains: filter.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    return where;
  }

  private constructArgs(
    filter?: FilterQueryType,
  ): Prisma.MasterMemberFindManyArgs {
    const args: Prisma.MasterMemberFindManyArgs = {
      where: this.constructWhere(filter),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: filter?.sortBy ? { [filter?.sortBy]: filter?.sort } : undefined,
      include: {
        masterMemberCategory: {
          select: { id: true, code: true, name: true, color: true },
        },
      },
    };
    return args;
  }

  getAllMembers = async (filter?: FilterQueryType) => {
    const [rows, count] = await Promise.all([
      this.prisma.masterMember.findMany(this.constructArgs(filter)),
      this.prisma.masterMember.count({ where: this.constructWhere(filter) }),
    ]);

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });
    return { rows, pagination };
  };

  getMemberById = async (id: number) => {
    const data = await this.prisma.masterMember.findFirst({
      where: { id, deletedAt: null },
      include: {
        masterMemberCategory: {
          select: { id: true, code: true, name: true, color: true },
        },
      },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return data;
  };

  getMemberByCode = async (code: string) => {
    const data = await this.prisma.masterMember.findFirst({
      where: { code, deletedAt: null },
      include: {
        masterMemberCategory: {
          select: { id: true, code: true, name: true, color: true },
        },
      },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return data;
  };

  createMember = async (data: MemberBodyType) => {
    const uppercaseCode = data.code.toUpperCase();
    // Validate category exists
    const category = await this.prisma.masterMemberCategory.findFirst({
      where: { id: data.masterMemberCategoryId, deletedAt: null },
    });
    if (!category) {
      throw new BadRequestError("Kategori member tidak ditemukan");
    }

    const existing = await this.prisma.masterMember.findFirst({
      where: { code: uppercaseCode },
    });

    if (existing) {
      if (existing.deletedAt === null) {
        throw new BadRequestError("Kode member sudah ada");
      } else {
        return await this.prisma.masterMember.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            masterMemberCategoryId: data.masterMemberCategoryId,
            code: uppercaseCode,
            deletedAt: null,
          },
          include: {
            masterMemberCategory: {
              select: { id: true, code: true, name: true, color: true },
            },
          },
        });
      }
    }

    return await this.prisma.masterMember.create({
      data: {
        code: uppercaseCode,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        masterMemberCategoryId: data.masterMemberCategoryId,
      },
      include: {
        masterMemberCategory: {
          select: { id: true, code: true, name: true, color: true },
        },
      },
    });
  };

  updateMember = async (id: number, data: MemberBodyType) => {
    const uppercaseCode = data.code.toUpperCase();
    const existing = await this.prisma.masterMember.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError();
    }

    // Validate category exists
    const category = await this.prisma.masterMemberCategory.findFirst({
      where: { id: data.masterMemberCategoryId, deletedAt: null },
    });
    if (!category) {
      throw new BadRequestError("Kategori member tidak ditemukan");
    }

    const codeCheck = await this.prisma.masterMember.findFirst({
      where: {
        code: uppercaseCode,
        deletedAt: null,
        NOT: { id },
      },
    });
    if (codeCheck) {
      throw new BadRequestError("Kode member sudah ada");
    }

    return await this.prisma.masterMember.update({
      where: { id },
      data: {
        code: uppercaseCode,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        masterMemberCategoryId: data.masterMemberCategoryId,
      },
      include: {
        masterMemberCategory: {
          select: { id: true, code: true, name: true, color: true },
        },
      },
    });
  };

  deleteMember = async (id: number) => {
    const data = await this.prisma.masterMember.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundError();
    }
    return await this.prisma.masterMember.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  };
}
