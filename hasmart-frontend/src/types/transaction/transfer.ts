import { BaseResponse } from "@/types/common";
import { Branch } from "@/types/app/branch";
import { Item, ItemVariant } from "@/types/master/item";

export interface TransferItem {
  id: number;
  transactionTransferId: number;
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
  recordedConversion: number;
  totalQty: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Relations
  masterItem?: Item;
  masterItemVariant?: ItemVariant;
}

export interface Transfer {
  id: number;
  transactionDate: string;
  notes?: string;
  fromId: number;
  toId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Relations
  from?: Branch;
  to?: Branch;
  transactionTransferItems?: TransferItem[];
}

export interface CreateTransferItemDTO {
  masterItemId: number;
  masterItemVariantId: number;
  qty: number;
}

export interface CreateTransferDTO {
  transactionDate: Date;
  fromId: number;
  toId: number;
  notes?: string;
  items: CreateTransferItemDTO[];
}

export type UpdateTransferDTO = Partial<CreateTransferDTO>;

export type TransferResponse = BaseResponse<Transfer>;
export type TransferListResponse = BaseResponse<Transfer[]>;
