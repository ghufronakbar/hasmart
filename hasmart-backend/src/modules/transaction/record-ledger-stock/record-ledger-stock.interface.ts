import { LedgerStockModelType } from ".prisma/client";

export type CommonRecordModel = Exclude<
  LedgerStockModelType,
  | "TRANSACTION_TRANSFER_IN"
  | "TRANSACTION_TRANSFER_OUT"
  | "TRANSACTION_ADJUSTMENT"
>;

export interface RecordCommonPayloadCreate {
  parentId: number;
  userId: number;
  branchId: number;
  transactionDate: Date;
  masterSupplierId?: number;
  masterMemberId?: number;
  modelType: CommonRecordModel;
  items: {
    id: number;
    masterItemId: number;
    totalQty: number;
  }[];
}

export interface RecordCommonPayloadDelete {
  parentId: number;
  modelType: CommonRecordModel;
  userId: number;
}

// Payload update: items berisi data baru + oldTotalQty (qty sebelum update)
// oldTotalQty harus disediakan oleh caller karena items lama sudah di-hard-delete dari DB
export interface RecordCommonPayloadUpdate {
  parentId: number;
  userId: number;
  branchId: number;
  transactionDate: Date;
  masterSupplierId?: number;
  masterMemberId?: number;
  modelType: CommonRecordModel;
  items: {
    id: number;
    masterItemId: number;
    totalQty: number; // qty baru (setelah update)
    oldTotalQty: number; // qty lama (sebelum update), 0 jika item baru
  }[];
}
