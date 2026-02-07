import { BaseResponse } from "../common";

export interface Branch {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  fax?: string | null;
  npwp?: string | null;
  ownerName?: string | null;
  receiptSize?: string | null;
  receiptFooter?: string | null;
  receiptPrinter?: string | null;
  labelBarcodePrinter?: string | null;
  reportPrinter?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateBranchDTO {
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  fax?: string | null;
  npwp?: string | null;
  ownerName?: string | null;
  receiptSize?: string | null;
  receiptFooter?: string | null;
  receiptPrinter?: string | null;
  labelBarcodePrinter?: string | null;
  reportPrinter?: string | null;
}

export type UpdateBranchDTO = Partial<CreateBranchDTO>;

export type BranchResponse = BaseResponse<Branch>;
export type BranchListResponse = BaseResponse<Branch[]>;
