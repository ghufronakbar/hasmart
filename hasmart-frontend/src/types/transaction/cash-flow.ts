import { BaseResponse, PaginationInfo } from "@/types/common";
import { Branch } from "@/types/app/branch";

export type CashFlowType = "IN" | "OUT";

export interface CashFlow {
  id: number;
  branchId: number;
  branch?: Branch;
  notes: string;
  amount: string; // Decimal from backend comes as string or number, usually handled as string/number in frontend
  type: CashFlowType;
  transactionDate: string; // ISO Date string
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashFlowDTO {
  branchId: number;
  notes: string;
  amount: number;
  type: CashFlowType;
  transactionDate: string; // ISO Date string
}

export interface UpdateCashFlowDTO {
  branchId: number;
  notes: string;
  amount: number;
  type: CashFlowType;
  transactionDate: string; // ISO Date string
}

export interface CashFlowListResponse extends BaseResponse<CashFlow[]> {
  pagination: PaginationInfo;
}

export type CashFlowResponse = BaseResponse<CashFlow>;
