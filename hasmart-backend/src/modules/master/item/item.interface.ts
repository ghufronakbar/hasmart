import { MasterItem, MasterItemVariant, ItemBranch } from ".prisma/client";

// Database result types with includes
export interface ItemBranchSelect {
  branchId: number;
  recordedStock: number;
}

export interface CategorySelect {
  id: number;
  code: string;
  name: string;
}

export interface SupplierSelect {
  id: number;
  code: string;
  name: string;
}

export interface MasterItemWithIncludes extends MasterItem {
  masterItemCategory: CategorySelect;
  masterSupplier: SupplierSelect;
  masterItemVariants: MasterItemVariant[];
  itemBranches: ItemBranchSelect[];
}

// Response interfaces for consistent API responses
// NOTE: Financial fields are strings to preserve Decimal precision
export interface ItemVariantResponse {
  id: number;
  unit: string;
  amount: number; // conversion amount, stays as number
  recordedBuyPrice: string; // CHANGED: Decimal → string
  recordedProfitPercentage: string; // CHANGED: Decimal → string
  recordedProfitAmount: string; // CHANGED: Decimal → string
  sellPrice: string; // CHANGED: Decimal → string
  isBaseUnit: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemResponse {
  id: number;
  name: string;
  code: string;
  masterItemCategoryId: number;
  masterSupplierId: number;
  isActive: boolean;
  recordedBuyPrice: string; // CHANGED: Decimal → string
  stock: number;
  masterItemCategory: CategorySelect;
  masterSupplier: SupplierSelect;
  masterItemVariants: ItemVariantResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemListResponse {
  id: number;
  name: string;
  code: string;
  masterItemCategoryId: number;
  masterSupplierId: number;
  isActive: boolean;
  recordedBuyPrice: string; // CHANGED: Decimal → string
  stock: number;
  masterItemCategory: CategorySelect;
  masterSupplier: SupplierSelect;
  masterItemVariants: ItemVariantResponse[];
  createdAt: Date;
  updatedAt: Date;
}
