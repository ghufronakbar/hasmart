import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  ItemBodyType,
  ItemBulkUpdateVariantPriceBodyType,
  ItemQueryType,
  ItemUpdateBodyType,
  MasterItemVariantUpdateType,
} from "./item.validator";
import {
  ItemListResponse,
  ItemResponse,
  MasterItemWithIncludes,
} from "./item.interface";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import { FilterQueryType } from "src/middleware/use-filter";
import { Prisma } from ".prisma/client";
import { BranchQueryType } from "src/middleware/use-branch";
import { RefreshBuyPriceService } from "../../transaction/refresh-buy-price/refresh-buy-price.service";

export class ItemService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshBuyPriceService: RefreshBuyPriceService,
  ) {
    super();
  }

  getItemByCode = async (code: string) => {
    const item = await this.prisma.masterItem.findFirst({
      where: {
        code: { equals: code, mode: "insensitive" },
        deletedAt: null,
      },
      include: {
        masterItemCategory: {
          select: { id: true, code: true, name: true },
        },
        masterSupplier: {
          select: { id: true, code: true, name: true },
        },
        masterItemVariants: {
          where: { deletedAt: null },
          orderBy: { isBaseUnit: "desc" },
        },
      },
    });

    if (!item) {
      throw new NotFoundError();
    }

    return item;
  };

  private constructWhere(
    filter?: FilterQueryType,
    itemQuery?: ItemQueryType,
  ): Prisma.MasterItemWhereInput {
    const where: Prisma.MasterItemWhereInput = {
      deletedAt: null,
      id:
        Array.isArray(itemQuery?.idNotIns) && itemQuery.idNotIns.length > 0
          ? { notIn: itemQuery.idNotIns }
          : undefined,
      OR: filter?.search
        ? [
            { name: { contains: filter.search, mode: "insensitive" } },
            { code: { contains: filter.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    if (itemQuery?.onlyActive === true) {
      where.isActive = true;
    }
    return where;
  }

  private constructArgs(
    filter?: FilterQueryType,
    itemQuery?: ItemQueryType,
  ): Prisma.MasterItemFindManyArgs {
    const args: Prisma.MasterItemFindManyArgs = {
      where: this.constructWhere(filter, itemQuery),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: this.constructOrder(filter),
      include: {
        masterItemCategory: {
          select: { id: true, code: true, name: true },
        },
        masterSupplier: {
          select: { id: true, code: true, name: true },
        },
        masterItemVariants: {
          where: { deletedAt: null },
          orderBy: { isBaseUnit: "desc" },
        },
        itemBranches: {
          where: { deletedAt: null },
          select: { branchId: true, recordedStock: true },
        },
      },
    };

    return args;
  }

  private constructOrder(
    filter?: FilterQueryType,
  ): Prisma.MasterItemOrderByWithRelationInput | undefined {
    switch (filter?.sortBy) {
      case "supplier":
        return {
          masterSupplier: {
            name: filter?.sort,
          },
        };
      case "category":
        return {
          masterItemCategory: {
            name: filter?.sort,
          },
        };
      default:
        return filter?.sortBy
          ? { [filter?.sortBy]: filter?.sort }
          : { id: "desc" };
    }
  }

  private mapToListResponse(
    item: MasterItemWithIncludes,
    branchId?: number,
  ): ItemListResponse {
    let stock = 0;

    if (branchId) {
      const branchStock = item.itemBranches.find(
        (ib) => ib.branchId === branchId,
      );
      stock = branchStock?.recordedStock ?? 0;
    } else {
      stock = item.itemBranches.reduce(
        (total, variant) => total + variant.recordedStock,
        0,
      );
    }

    return {
      id: item.id,
      name: item.name,
      code: item.code,
      masterItemCategoryId: item.masterItemCategoryId,
      masterSupplierId: item.masterSupplierId,
      isActive: item.isActive,
      recordedBuyPrice: item.recordedBuyPrice.toFixed(2),
      stock,
      masterItemCategory: item.masterItemCategory,
      masterSupplier: item.masterSupplier,
      masterItemVariants: item.masterItemVariants.map((v) => ({
        id: v.id,
        unit: v.unit,
        amount: v.amount,
        recordedBuyPrice: v.recordedBuyPrice.toFixed(2),
        recordedProfitPercentage: v.recordedProfitPercentage.toFixed(2),
        recordedProfitAmount: v.recordedProfitAmount.toFixed(2),
        sellPrice: v.sellPrice.toFixed(2),
        isBaseUnit: v.isBaseUnit,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  getAllItems = async (
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
    itemQuery?: ItemQueryType,
  ) => {
    const [rows, count] = await Promise.all([
      this.prisma.masterItem.findMany(this.constructArgs(filter, itemQuery)),
      this.prisma.masterItem.count({
        where: this.constructWhere(filter, itemQuery),
      }),
    ]);

    const mappedRows = (rows as unknown as MasterItemWithIncludes[]).map(
      (item) => this.mapToListResponse(item, branchQuery?.branchId),
    );

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });
    return { rows: mappedRows, pagination };
  };

  getItemById = async (
    id: number,
    branchQuery?: BranchQueryType,
  ): Promise<ItemResponse> => {
    const item = await this.prisma.masterItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        masterItemCategory: {
          select: { id: true, code: true, name: true },
        },
        masterSupplier: {
          select: { id: true, code: true, name: true },
        },
        masterItemVariants: {
          where: { deletedAt: null },
          orderBy: { isBaseUnit: "desc" },
        },
        itemBranches: {
          where: { deletedAt: null },
          select: { branchId: true, recordedStock: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundError();
    }

    return this.mapToListResponse(
      item as unknown as MasterItemWithIncludes,
      branchQuery?.branchId,
    ) as ItemResponse;
  };

  createItem = async (data: ItemBodyType) => {
    // Validate supplier exists
    const supplier = await this.prisma.masterSupplier.findFirst({
      where: {
        code: { equals: data.masterSupplierCode, mode: "insensitive" },
        deletedAt: null,
      },
    });
    if (!supplier) {
      throw new BadRequestError("Supplier tidak ditemukan");
    }

    let countBaseUnit = 0;

    for (const variant of data.masterItemVariants) {
      if (variant.amount === 1) {
        countBaseUnit++;
      }
    }

    if (countBaseUnit > 1) {
      throw new BadRequestError("Hanya boleh ada 1 base unit");
    }

    if (countBaseUnit < 1) {
      throw new BadRequestError("Harus ada 1 base unit");
    }

    // Validate category exists
    const category = await this.prisma.masterItemCategory.findFirst({
      where: {
        code: { equals: data.masterItemCategoryCode, mode: "insensitive" },
        deletedAt: null,
      },
    });
    if (!category) {
      throw new BadRequestError("Kategori tidak ditemukan");
    }

    // Check for duplicate item code
    const upperCode = data.code.toUpperCase();
    const existingItem = await this.prisma.masterItem.findFirst({
      where: { code: upperCode },
    });
    if (existingItem && existingItem.deletedAt === null) {
      throw new BadRequestError(`Kode item "${upperCode}" sudah digunakan`);
    }

    let itemId = 0;

    await this.prisma.$transaction(async (tx) => {
      // If item code was soft deleted, restore it
      if (existingItem && existingItem.deletedAt !== null) {
        await this.prisma.masterItem.update({
          where: { id: existingItem.id },
          data: {
            name: data.name,
            masterSupplierId: supplier.id,
            masterItemCategoryId: category.id,
            isActive: data.isActive,
            deletedAt: null,
          },
        });
        itemId = existingItem.id;
        // Create variants for restored item
        for (const v of data.masterItemVariants) {
          await this.prisma.masterItemVariant.create({
            data: {
              masterItemId: itemId,
              unit: v.unit,
              amount: v.amount,
              sellPrice: v.sellPrice,
              isBaseUnit: v.amount === 1,
              recordedBuyPrice: 0,
              recordedProfitPercentage: 0,
              recordedProfitAmount: 0,
            },
          });
        }
      } else {
        const item = await this.prisma.masterItem.create({
          data: {
            name: data.name,
            code: upperCode,
            masterSupplierId: supplier.id,
            masterItemCategoryId: category.id,
            isActive: data.isActive,
            recordedBuyPrice: 0,
            masterItemVariants: {
              create: data.masterItemVariants.map((v) => ({
                unit: v.unit,
                amount: v.amount,
                sellPrice: v.sellPrice,
                isBaseUnit: v.amount === 1,
                recordedBuyPrice: 0,
                recordedProfitPercentage: 0,
                recordedProfitAmount: 0,
              })),
            },
          },
        });
        itemId = item.id;
      }
    });
    return this.getItemById(itemId);
  };

  updateItem = async (id: number, data: ItemUpdateBodyType, userId: number) => {
    let countBaseUnit = 0;
    for (const variant of data.masterItemVariants) {
      if (variant.action !== "delete" && variant.amount === 1) {
        countBaseUnit++;
      }
    }

    if (countBaseUnit > 1) {
      throw new BadRequestError("Hanya boleh ada 1 base unit");
    }

    if (countBaseUnit < 1) {
      throw new BadRequestError("Harus ada 1 base unit");
    }
    const item = await this.prisma.masterItem.findFirst({
      where: { id, deletedAt: null },
      select: {
        recordedBuyPrice: true,
        itemBranches: {
          where: {
            deletedAt: null,
          },
          select: {
            recordedStock: true,
          },
        },
        masterItemVariants: {
          select: {
            id: true,
          },
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError();
    }

    let totalStock = 0;
    for (const branch of item.itemBranches) {
      totalStock += branch.recordedStock;
    }

    // Validate supplier exists
    const [supplier, category] = await Promise.all([
      this.prisma.masterSupplier.findFirst({
        where: {
          code: { equals: data.masterSupplierCode, mode: "insensitive" },
          deletedAt: null,
        },
        select: {
          id: true,
        },
      }),
      this.prisma.masterItemCategory.findFirst({
        where: {
          code: { equals: data.masterItemCategoryCode, mode: "insensitive" },
          deletedAt: null,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!supplier) {
      throw new BadRequestError("Supplier tidak ditemukan");
    }

    // Validate category exists
    if (!category) {
      throw new BadRequestError("Kategori tidak ditemukan");
    }

    const rawVariantIds: number[] = item.masterItemVariants.map((v) => v.id);

    const updateVariants: (MasterItemVariantUpdateType & { id: number })[] = [];
    const deleteVariants: number[] = [];
    const createVariants: MasterItemVariantUpdateType[] = [];

    for (const variant of data.masterItemVariants) {
      if (variant.action === "update") {
        if (!variant.id) {
          throw new BadRequestError("Id harus diisi saat update variant");
        }
        if (!rawVariantIds.includes(variant.id)) {
          throw new BadRequestError("Variant tidak ditemukan");
        }
        updateVariants.push({
          id: variant.id,
          unit: variant.unit,
          amount: variant.amount,
          sellPrice: variant.sellPrice,
          action: variant.action,
        });
      }

      if (variant.action === "delete") {
        if (!variant.id) {
          throw new BadRequestError("Id harus diisi saat delete variant");
        }
        if (!rawVariantIds.includes(variant.id)) {
          throw new BadRequestError("Variant tidak ditemukan");
        }
        deleteVariants.push(variant.id);
      }

      if (variant.action === "create") {
        createVariants.push(variant);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const promises: Promise<unknown>[] = [];
      const updateMaster = tx.masterItem.update({
        where: { id },
        data: {
          name: data.name,
          masterSupplierId: supplier.id,
          masterItemCategoryId: category.id,
          isActive: data.isActive,
        },
      });
      promises.push(updateMaster);

      // update
      for (const variant of updateVariants) {
        const updateVariant = tx.masterItemVariant.update({
          where: { id: variant.id },
          data: {
            unit: variant.unit,
            amount: variant.amount,
            sellPrice: variant.sellPrice,
            isBaseUnit: variant.amount === 1,
          },
        });
        promises.push(updateVariant);
      }

      // delete
      for (const variant of deleteVariants) {
        const deleteVariant = tx.masterItemVariant.update({
          where: { id: variant },
          data: {
            deletedAt: new Date(),
          },
        });
        promises.push(deleteVariant);
      }

      // create
      for (const variant of createVariants) {
        const createVariant = tx.masterItemVariant.create({
          data: {
            masterItemId: id,
            unit: variant.unit,
            amount: variant.amount,
            sellPrice: variant.sellPrice,
            isBaseUnit: variant.amount === 1,
            recordedBuyPrice: 0,
            recordedProfitPercentage: 0,
            recordedProfitAmount: 0,
          },
        });
        promises.push(createVariant);
      }

      const isBuyPriceChanged = !item.recordedBuyPrice
        .toDecimalPlaces(2)
        .equals(data.buyPrice.toDecimalPlaces(2));

      if (isBuyPriceChanged) {
        const override = tx.itemBuyPriceOverride.create({
          data: {
            newBuyPrice: data.buyPrice,
            snapshotStock: totalStock,
            userId,
            masterItemId: id,
            notes: `Update harga beli dari ${item.recordedBuyPrice} menjadi ${data.buyPrice}`,
          },
        });
        promises.push(override);
      }

      await Promise.all(promises);
    });

    await this.refreshBuyPriceService.refreshBuyPrice(id);

    return this.getItemById(id);
  };

  deleteItem = async (id: number) => {
    const item = await this.prisma.masterItem.findFirst({
      where: { id, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundError();
    }

    return await this.prisma.masterItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        masterItemVariants: {
          updateMany: {
            where: { deletedAt: null },
            data: { deletedAt: new Date() },
          },
        },
      },
    });
  };

  bulkUpdateVariantPrice = async (data: ItemBulkUpdateVariantPriceBodyType) => {
    const { masterItemVariants, sellPrice } = data;

    const uniqueVariantIds = Array.from(new Set(masterItemVariants));

    if (uniqueVariantIds.length !== masterItemVariants.length) {
      throw new BadRequestError("Variant ID tidak boleh duplikat");
    }

    const checkAllVariants = await this.prisma.masterItemVariant.findMany({
      where: { id: { in: uniqueVariantIds }, deletedAt: null },
      select: {
        id: true,
        masterItemId: true,
      },
    });

    if (checkAllVariants.length !== uniqueVariantIds.length) {
      throw new BadRequestError("Variant ID tidak ditemukan");
    }

    const uniqueItemIds = Array.from(
      new Set(checkAllVariants.map((v) => v.masterItemId)),
    );

    // 2. UPDATE ALL
    await this.prisma.masterItemVariant.updateMany({
      where: {
        id: { in: uniqueVariantIds },
      },
      data: {
        sellPrice: sellPrice,
      },
    });

    // 3. Trigger Refresh Logic
    await Promise.all(
      uniqueItemIds.map((id) =>
        this.refreshBuyPriceService.refreshBuyPrice(id),
      ),
    );

    return true;
  };
}
