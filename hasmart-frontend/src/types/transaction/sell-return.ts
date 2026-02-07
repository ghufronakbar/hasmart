import { BaseResponse } from "../common";
import { Item, ItemVariant } from "../master/item";
import { Member } from "../master/member";

export interface SellReturnItem {
  id: number;
  transactionSellReturnId: number;
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  sellPrice: string; // Decimal from backend
  recordedTotalAmount: string; // Decimal from backend
  masterItem?: Item;
  masterItemVariant?: ItemVariant;
  discounts?: { percentage: string }[]; // Decimal from backend
  createdAt: string;
  updatedAt: string;
}

export interface SellReturn {
  id: number;
  invoiceNumber: string; // return number (RTG-...)
  transactionDate: string;
  dueDate: string;
  branchId: number;
  memberCode: string;
  masterMemberId: number;
  notes?: string | null;
  taxPercentage: string; // Decimal from backend
  recordedTaxPercentage?: string; // Decimal from backend
  recordedTaxAmount: string; // Decimal from backend
  recordedTotalAmount: string; // Decimal from backend
  masterMember?: Member;
  items: SellReturnItem[];
  // Backend response might include this for mapping
  transactionSellReturnItems?: SellReturnItem[];
  transactionSellId?: number;
  transactionSell?: { invoiceNumber: string };
  transactionSellInvoiceNumber?: string; // Optional flattened field
  originalInvoiceNumber?: string; // For form compatibility
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateSellReturnItemDTO {
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  sellPrice: number;
  discounts?: { percentage: number }[];
}

export interface CreateSellReturnDTO {
  branchId: number;
  transactionDate: string;
  dueDate: string;
  memberCode: string;
  notes?: string | null;
  taxPercentage?: number;
  items: CreateSellReturnItemDTO[];
  originalInvoiceNumber?: string;
  invoiceNumber?: string; // Allow manual override if needed?
}

export type UpdateSellReturnDTO = Partial<CreateSellReturnDTO>;

export type SellReturnResponse = BaseResponse<SellReturn>;
export type SellReturnListResponse = BaseResponse<SellReturn[]>;
