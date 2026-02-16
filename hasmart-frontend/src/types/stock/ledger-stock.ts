import { PaginationInfo } from "@/types/common";

export type LedgerStockModelType =
  | "TRANSACTION_PURCHASE"
  | "TRANSACTION_PURCHASE_RETURN"
  | "TRANSACTION_SALES"
  | "TRANSACTION_SALES_RETURN"
  | "TRANSACTION_SELL"
  | "TRANSACTION_SELL_RETURN"
  | "TRANSACTION_TRANSFER_IN"
  | "TRANSACTION_TRANSFER_OUT"
  | "TRANSACTION_ADJUSTMENT";

export type LedgerStockActionType = "CREATE" | "UPDATE" | "DELETE";

export interface LedgerStockItem {
  id: number;
  masterItem: {
    id: number;
    name: string;
  };
  modelType: LedgerStockModelType;
  gapAmount: number;
  recordedStockAfterAmount: number;
  actionType: LedgerStockActionType;
  user: {
    id: number;
    name: string;
  };
  invoiceNumberReff: string;
  additionalNote: string;
  transactionDate: string;
  createdAt: string;
}

export interface LedgerStockListResponse {
  data: LedgerStockItem[];
  pagination: PaginationInfo;
}

export interface LedgerStockQuery {
  branchId?: number;
  modelType?: LedgerStockModelType;
  actionType?: LedgerStockActionType;
  masterItemId?: number;
  masterMemberId?: number;
  masterSupplierId?: number;
  sortBy?: "createdAt" | "transactionDate";
  sort?: "asc" | "desc";
  dateStart?: string;
  dateEnd?: string;
  page?: number;
  limit?: number;
}
