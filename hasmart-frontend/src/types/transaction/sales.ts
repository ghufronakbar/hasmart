import { BaseResponse } from "../common";
import { Item, ItemVariant } from "../master/item";
import { Member } from "../master/member";

export interface SalesItem {
  id: number;
  transactionSalesId: number;
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  salesPrice: string; // Decimal from backend
  recordedTotalAmount: string; // Decimal from backend
  masterItem?: Item;
  masterItemVariant?: ItemVariant;
  transactionSalesDiscounts?: {
    id: number;
    percentage: string; // Decimal from backend
    recordedAmount: string; // Decimal from backend
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Sales {
  id: number;
  invoiceNumber: string;
  transactionDate: string;
  branchId: number;
  memberCode?: string | null;
  masterMemberId?: number | null;
  notes?: string | null;
  recordedTotalAmount: string; // Decimal from backend
  cashReceived: string; // Decimal from backend
  cashChange: string; // Decimal from backend
  paymentType: "CASH" | "DEBIT" | "QRIS";
  masterMember?: Member;
  transactionSalesItems?: SalesItem[]; // Backend relation name
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateSalesItemDTO {
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  salesPrice: number;
  discounts?: { percentage: number }[];
}

export interface CreateSalesDTO {
  branchId: number;
  memberCode?: string | null;
  notes?: string | null;
  cashReceived: number;
  paymentType: "CASH" | "DEBIT" | "QRIS";
  items: CreateSalesItemDTO[];
}

export type UpdateSalesDTO = Partial<CreateSalesDTO>;

export type SalesResponse = BaseResponse<Sales>;
export type SalesListResponse = BaseResponse<Sales[]>;
