import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { LabelData } from "./label.interface";
import { LabelQueryParamsType } from "./label.validator";

export class LabelService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  getLabel = async (data: LabelQueryParamsType): Promise<LabelData[]> => {
    const items = await this.prisma.masterItem.findMany({
      where: {
        id: {
          in: data.masterItemIds,
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        name: true,
        code: true,
        masterItemVariants: {
          select: {
            sellPrice: true,
            unit: true,
          },
          where: {
            deletedAt: null,
            ...(data.onlyBaseUnit
              ? {
                  isBaseUnit: true,
                }
              : {}),
          },
        },
      },
    });

    const response: LabelData[] = [];
    for (const item of items) {
      response.push({
        itemName: item.name?.toUpperCase(),
        itemCode: item.code?.toUpperCase(),
        variants: item.masterItemVariants.map((variant) => ({
          unit: variant.unit?.toUpperCase(),
          sellPrice: variant.sellPrice.toString(),
        })),
      });
    }
    return response;
  };
}
