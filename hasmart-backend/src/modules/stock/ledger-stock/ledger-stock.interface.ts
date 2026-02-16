import {
  FrontStockTransfer,
  FrontStockTransferItem,
  LedgerStockActionType,
  LedgerStockModelType,
  MasterItem,
  MasterItemVariant,
  User,
} from ".prisma/client";

// untuk response item
export interface LedgerStockItemResponse {
  id: number; // ledger stock id
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
  invoiceNumberReff: string; // untuk transfer dan adjustment buat format "TRANSFER DD-MM-YYYY"
  additionalNote: string;
  // jika sell/sales/return maka akan diisi dengan data "masterMember.name (masterMember.code) - masterMember.masterMemberCategory.code"
  // jika purchase maka akan diisi dengan data "masterSupplier.name (masterSupplier.code)"
  // jika transfer out maka akan diisi dengan branch tujuan "branch.name (branch.code)"
  // jika transfer in maka akan diisi dengan branch asal "branch.name (branch.code)"
  // jika adjustment maka akan diisi dengan "Penyesuaian Stok - DD-MM-YYYY"
  // pastikan ada fallback string kosong jika tidak ada
  transactionDate: Date;
  createdAt: Date;
}
