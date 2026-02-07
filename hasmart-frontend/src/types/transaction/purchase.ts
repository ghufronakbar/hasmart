import { BaseResponse } from "../common";
import { Item, ItemVariant } from "../master/item";
import { Supplier } from "../master/supplier";

export interface PurchaseItemDiscount {
  percentage: string; // Decimal from backend
}

export interface PurchaseItem {
  id: number;
  transactionPurchaseId: number;
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  purchasePrice: string; // Decimal from backend
  recordedTotalAmount: string; // Decimal from backend
  masterItem?: Item;
  masterItemVariant?: ItemVariant;
  discounts?: PurchaseItemDiscount[];
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: number;
  invoiceNumber: string;
  transactionDate: string;
  dueDate?: string | null;
  masterSupplierId: number;
  branchId: number;
  notes?: string | null;
  taxAmount: string; // Decimal from backend
  recordedTaxAmount: string; // Decimal from backend
  recordedTaxPercentage: string; // Decimal from backend
  recordedTotalAmount: string; // Decimal from backend
  masterSupplier?: Supplier;
  items: PurchaseItem[];
  // Backend response might have items here
  transactionPurchaseItems?: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreatePurchaseItemDTO {
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  purchasePrice: number;
  discounts?: { percentage: number }[];
}

export interface CreatePurchaseDTO {
  invoiceNumber: string;
  transactionDate: string;
  dueDate?: string | null;
  masterSupplierCode: string;
  branchId: number;
  notes?: string | null;
  taxPercentage: number;
  items: CreatePurchaseItemDTO[];
}

export type UpdatePurchaseDTO = CreatePurchaseDTO;

export type PurchaseResponse = BaseResponse<Purchase>;
export type PurchaseListResponse = BaseResponse<Purchase[]>;
