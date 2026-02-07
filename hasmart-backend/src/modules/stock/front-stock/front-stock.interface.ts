import {
  FrontStockTransfer,
  FrontStockTransferItem,
  MasterItem,
  MasterItemVariant,
  User,
} from ".prisma/client";

// untuk response item
export interface ItemFrontStockResponse {
  id: number; // master item id
  name: string; // master item name
  code: string; // master item code
  supplier: string; // master item supplier.name
  category: string; // master item category.name
  frontStock: number;
  rearStock: number;
  variants: MasterItemVariant[];
}

// untuk response history transaksi
type FrontStockTransferItemResponse = FrontStockTransferItem & {
  masterItem: MasterItem;
  masterItemVariant?: MasterItemVariant | null;
};
export type FrontStockTransferResponse = FrontStockTransfer & {
  items: FrontStockTransferItemResponse[];
  user: User;
};
