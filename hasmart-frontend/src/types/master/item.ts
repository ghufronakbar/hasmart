import { BaseResponse } from "../common";
import { ItemCategory } from "./item-category";
import { Supplier } from "./supplier";

export interface ItemVariant {
  id: number;
  unit: string;
  amount: number;
  sellPrice: string; // Decimal from backend
  recordedProfitPercentage: string; // Decimal from backend
  recordedProfitAmount: string; // Decimal from backend
  isBaseUnit: boolean;
  masterItemId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Item {
  id: number;
  name: string;
  code: string;
  masterItemCategoryId: number;
  masterSupplierId: number;
  isActive: boolean;
  recordedBuyPrice: string; // Decimal from backend
  stock: number; // Global stock or branch-specific based on query
  masterItemCategory?: ItemCategory;
  masterSupplier?: Supplier;
  masterItemVariants: ItemVariant[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateItemVariantDTO {
  unit: string;
  amount: number;
  sellPrice: number;
  isBaseUnit: boolean;
}

export interface CreateItemDTO {
  name: string;
  code: string;
  masterSupplierCode: string;
  masterItemCategoryCode: string;
  isActive: boolean;
  masterItemVariants: CreateItemVariantDTO[];
}

export interface UpdateItemDTO {
  name?: string;
  code?: string;
  masterSupplierCode?: string;
  masterItemCategoryCode?: string;
  isActive?: boolean;
  masterItemVariants?: MasterItemVariantUpdateDTO[];
  buyPrice?: number;
}

export interface MasterItemVariantUpdateDTO {
  id?: number;
  unit: string;
  amount: number;
  sellPrice: number;
  isBaseUnit: boolean;
  action: "create" | "update" | "delete";
}

export type UpdateItemVariantDTO = Partial<CreateItemVariantDTO>;

export type ItemResponse = BaseResponse<Item>;
export type ItemListResponse = BaseResponse<Item[]>;

// Updated: getItemByCode now returns Item (not ItemVariantWithItem)
export type ItemByCodeResponse = BaseResponse<Item>;
