import { BaseResponse } from "../common";

export interface Supplier {
  id: number;
  code: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateSupplierDTO {
  code: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
}

export type UpdateSupplierDTO = Partial<CreateSupplierDTO>;

export type SupplierResponse = BaseResponse<Supplier>;
export type SupplierListResponse = BaseResponse<Supplier[]>;
