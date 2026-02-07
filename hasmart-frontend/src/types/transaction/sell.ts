import { BaseResponse } from "../common";
import { Item, ItemVariant } from "../master/item";
import { Member } from "../master/member";

export interface SellItem {
  id: number;
  transactionSellId: number;
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

export interface Sell {
  id: number;
  invoiceNumber: string;
  transactionDate: string;
  dueDate: string;
  branchId: number;
  memberCode: string; // Mandatory
  masterMemberId: number;
  notes?: string | null;
  taxPercentage: string; // Decimal from backend
  recordedTaxPercentage?: string; // Decimal from backend
  recordedTaxAmount: string; // Decimal from backend
  recordedTotalAmount: string; // Decimal from backend
  masterMember?: Member;
  items: SellItem[];
  // Backend response might include this for mapping
  transactionSellItems?: SellItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateSellItemDTO {
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  sellPrice: number;
  discounts?: { percentage: number }[];
}

export interface CreateSellDTO {
  branchId: number;
  transactionDate: string;
  dueDate: string;
  memberCode: string; // Mandatory for B2B
  notes?: string | null;
  taxPercentage?: number;
  items: CreateSellItemDTO[];
}

export type UpdateSellDTO = Partial<CreateSellDTO>;

export type SellResponse = BaseResponse<Sell>;
export type SellListResponse = BaseResponse<Sell[]>;
