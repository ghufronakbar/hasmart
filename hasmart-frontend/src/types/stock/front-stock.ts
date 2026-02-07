import { PaginationInfo } from "@/types/common";

export interface FrontStockItem {
  id: number;
  code: string;
  name: string;
  frontStock: number;
  rearStock: number;
  supplier: string;
  category: string;
  unit: string; // derived from main unit or specific front stock unit logic if any
  // Add other fields as return by the backend if known, otherwise keep minimal based on requirements
  masterItemVariants: {
    id: number;
    code: string;
    unit: string;
    amount: number;
    price: number;
  }[];
}

export interface FrontStockItemResponse {
  data: FrontStockItem[];
  pagination: PaginationInfo;
}

export interface FrontStockTransfer {
  id: number;
  branchId: number;
  notes: string;
  createdAt: string; // ISO Date
  items: {
    id: number;
    frontStockTransferId: number;
    masterVariantId: number;
    amount: number;
    masterItem: {
      name: string;
      code: string;
    };
    masterItemVariant: {
      id: number;
      unit: string;
      amount: number;
    };
  }[];
  user: {
    id: number;
    name: string;
  };
}

export interface FrontStockTransferListResponse {
  data: FrontStockTransfer[];
  pagination: PaginationInfo;
}

export interface CreateFrontStockTransferItemDTO {
  masterVariantId: number;
  transferAmount: number;
}

export interface CreateFrontStockTransferDTO {
  branchId: number;
  notes?: string;
  items: CreateFrontStockTransferItemDTO[];
}
