import { BaseResponse } from "@/types/common";
import { Branch } from "@/types/app/branch";
import { Item, ItemVariant } from "@/types/master/item";

export interface TransactionAdjustmentItem {
  id: number;
  transactionAdjustmentId: number;
  masterItemId: number;
  masterItemVariantId: number;
  qty: number; // Actual Qty (input by user)
  recordedConversion: number;
  totalQty: number; // qty * conversion
  currentStock: number;
  gapAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Relations
  masterItem?: Item;
  masterItemVariant?: ItemVariant;
}

export interface TransactionAdjustment {
  id: number;
  notes?: string;
  masterItemId: number;
  masterItemVariantId: number;
  inputAmount: number;
  beforeAmount: number;
  beforeTotalAmount: number;
  finalAmount: number;
  finalTotalAmount: number;
  recordedGapConversion: number;
  totalGapAmount: number;
  branchId: number;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Relations
  branch?: Branch;
  masterItem?: Item;
  masterItemVariant?: ItemVariant;
  items?: TransactionAdjustmentItem[];
}

export interface CreateTransactionAdjustmentItemDTO {
  masterItemId: number;
  masterItemVariantId: number;
  actualQty: number;
}

export interface CreateTransactionAdjustmentDTO {
  branchId: number;
  transactionDate: Date;
  notes?: string;
  items: CreateTransactionAdjustmentItemDTO[];
}

export type TransactionAdjustmentResponse = BaseResponse<TransactionAdjustment>;
export type TransactionAdjustmentListResponse = BaseResponse<
  TransactionAdjustment[]
>;
