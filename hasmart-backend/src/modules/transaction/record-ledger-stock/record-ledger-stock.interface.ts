import { LedgerStockModelType } from ".prisma/client";

// COMMON
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

// ADJUSTMENT
export interface RecordAdjustmentPayloadCreate {
  userId: number;
  modelId: number;
  masterItemId: number;
  branchId: number;
  transactionDate: Date;
  gapAmount: number;
  recordedStockAfterAmount: number; // recorded stock after adjustment
  recordedStockBeforeAmount: number; // recorded stock before adjustment
}

export interface RecordAdjustmentPayloadDelete {
  userId: number;
  modelId: number;
  branchId: number;
}

// TRANSFER
export interface RecordTransferPayloadCreate {
  parentId: number;
  userId: number;
  branchId: number;
  transactionDate: Date;
  toBranchId: number;
  items: {
    id: number;
    masterItemId: number;
    totalQty: number;
  }[];
}
