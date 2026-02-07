import { BaseResponse } from "../common";
import { Item, ItemVariant } from "../master/item";
import { Member } from "../master/member";

export interface SalesReturnItem {
  id: number;
  transactionSalesReturnId: number;
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  salesPrice: string; // Decimal from backend
  recordedTotalAmount: string; // Decimal from backend
  masterItem?: Item;
  masterItemVariant?: ItemVariant;
  transactionSalesReturnDiscounts?: {
    id: number;
    percentage: string; // Decimal from backend
    recordedAmount: string; // Decimal from backend
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesReturn {
  id: number;
  returnNumber: string;
  transactionSalesId: number;
  notes?: string | null;
  recordedSubTotalAmount: string; // Decimal from backend
  recordedDiscountAmount: string; // Decimal from backend
  recordedTotalAmount: string; // Decimal from backend
  branchId: number;
  masterMemberId?: number | null;
  transactionSales?: {
    id: number;
    invoiceNumber: string;
  };
  masterMember?: Member;
  transactionSalesReturnItems: SalesReturnItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateSalesReturnItemDTO {
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  salesPrice: number;
  discounts?: { percentage: number }[];
}

export interface CreateSalesReturnDTO {
  transactionDate: Date;
  branchId: number;
  originalInvoiceNumber: string;
  notes?: string | null;
  items: CreateSalesReturnItemDTO[];
}

export type UpdateSalesReturnDTO = Partial<CreateSalesReturnDTO>;

export type SalesReturnResponse = BaseResponse<SalesReturn>;
export type SalesReturnListResponse = BaseResponse<SalesReturn[]>;
