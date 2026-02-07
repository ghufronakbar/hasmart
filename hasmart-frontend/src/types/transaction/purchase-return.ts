import { BaseResponse } from "../common";
import { Item, ItemVariant } from "../master/item";
import { Supplier } from "../master/supplier";

export interface PurchaseReturnItem {
  id: number;
  transactionPurchaseReturnId: number;
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  purchasePrice: string; // Decimal from backend
  recordedTotalAmount: string; // Decimal from backend
  masterItem?: Item;
  masterItemVariant?: ItemVariant;
  discounts?: { percentage: string }[]; // Decimal from backend
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseReturn {
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
  items: PurchaseReturnItem[];
  // Backend response might have items here
  transactionPurchaseReturnItems?: PurchaseReturnItem[];

  // Relations & Helper fields
  transactionPurchase?: { invoiceNumber: string };
  originalInvoiceNumber?: string;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreatePurchaseReturnItemDTO {
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  purchasePrice: number;
  discounts?: { percentage: number }[];
}

export interface CreatePurchaseReturnDTO {
  invoiceNumber: string;
  transactionDate: string;
  dueDate?: string | null;
  masterSupplierId: number;
  branchId: number;
  notes?: string | null;
  taxPercentage: number;
  items: CreatePurchaseReturnItemDTO[];
  originalInvoiceNumber: string;
}

export type UpdatePurchaseReturnDTO = CreatePurchaseReturnDTO;

export type PurchaseReturnResponse = BaseResponse<PurchaseReturn>;
export type PurchaseReturnListResponse = BaseResponse<PurchaseReturn[]>;
