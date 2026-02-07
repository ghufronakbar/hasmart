// backup-restore.schema.ts
import { z } from "zod";

/** helpers */
const IntSchema = z.number().int();

const DateTimeSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid datetime" });

/**
 * Prisma Decimal biasanya kamu stringify jadi string (via replacer).
 * Kalau user upload JSON yg decimalnya number, kita normalize ke string.
 */
const DecimalSchema = z
  .union([
    z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid decimal string"),
    z.number(),
  ])
  .transform((v) => (typeof v === "number" ? v.toString() : v));

const NullableString = z.string().nullable().optional();
const NullableDateTime = DateTimeSchema.nullable().optional();

/** =============== ENUMS =============== */
export const RecordActionModelTypeSchema = z.enum([
  "TRANSACTION_PURCHASE",
  "TRANSACTION_PURCHASE_RETURN",
  "TRANSACTION_SALES",
  "TRANSACTION_SALES_RETURN",
  "TRANSACTION_SELL",
  "TRANSACTION_SELL_RETURN",
  "TRANSACTION_TRANSFER",
  "TRANSACTION_ADJUSTMENT",
]);

export const RecordActionTypeSchema = z.enum(["CREATE", "UPDATE", "DELETE"]);

/** =============== MODELS (rows) =============== */

export const BranchRowSchema = z.object({
  id: IntSchema,

  code: z.string(),
  name: z.string(),
  address: NullableString,
  phone: NullableString,
  email: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  npwp: z.string().nullable().optional(),
  ownerName: z.string().nullable().optional(),

  receiptSize: z.string().nullable().optional(),
  receiptFooter: z.string().nullable().optional(),
  receiptPrinter: z.string().nullable().optional(),
  labelBarcodePrinter: z.string().nullable().optional(),
  reportPrinter: z.string().nullable().optional(),

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const UserRowSchema = z.object({
  id: IntSchema,
  name: z.string(),

  password: z.string(),
  isActive: z.boolean(),
  isSuperUser: z.boolean(),

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,

  refreshToken: z.string().nullable().optional(),

  // access general
  accessOverviewRead: z.boolean(),
  accessReportRead: z.boolean(),
  accessPointOfSalesRead: z.boolean(),
  accessPointOfSalesWrite: z.boolean(),
  accessPrintLabelRead: z.boolean(),
  accessFrontStockRead: z.boolean(),
  accessFrontStockWrite: z.boolean(),
  accessFrontStockHistoryRead: z.boolean(),

  // access app
  accessAppUserRead: z.boolean(),
  accessAppUserWrite: z.boolean(),
  accessAppBranchWrite: z.boolean(),

  // access master item
  accessMasterItemRead: z.boolean(),
  accessMasterItemWrite: z.boolean(),
  accessMasterItemCategoryRead: z.boolean(),
  accessMasterItemCategoryWrite: z.boolean(),
  accessMasterMemberRead: z.boolean(),
  accessMasterMemberWrite: z.boolean(),
  accessMasterMemberCategoryRead: z.boolean(),
  accessMasterMemberCategoryWrite: z.boolean(),
  accessMasterSupplierRead: z.boolean(),
  accessMasterSupplierWrite: z.boolean(),
  accessMasterUnitRead: z.boolean(),
  accessMasterUnitWrite: z.boolean(),

  // transaction
  accessTransactionPurchaseRead: z.boolean(),
  accessTransactionPurchaseWrite: z.boolean(),
  accessTransactionPurchaseReturnRead: z.boolean(),
  accessTransactionPurchaseReturnWrite: z.boolean(),
  accessTransactionSalesRead: z.boolean(),
  accessTransactionSalesWrite: z.boolean(),
  accessTransactionSalesReturnRead: z.boolean(),
  accessTransactionSalesReturnWrite: z.boolean(),
  accessTransactionSellRead: z.boolean(),
  accessTransactionSellWrite: z.boolean(),
  accessTransactionSellReturnRead: z.boolean(),
  accessTransactionSellReturnWrite: z.boolean(),
  accessTransactionTransferRead: z.boolean(),
  accessTransactionTransferWrite: z.boolean(),
  accessTransactionAdjustmentRead: z.boolean(),
  accessTransactionAdjustmentWrite: z.boolean(),
});

export const MasterItemCategoryRowSchema = z.object({
  id: IntSchema,
  code: z.string(),
  name: z.string(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const MasterSupplierRowSchema = z.object({
  id: IntSchema,
  code: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const MasterUnitRowSchema = z.object({
  id: IntSchema,
  unit: z.string(),
  name: z.string(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const MasterMemberCategoryRowSchema = z.object({
  id: IntSchema,
  code: z.string(),
  name: z.string(),
  color: z.string().length(6),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const MasterMemberRowSchema = z.object({
  id: IntSchema,
  code: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),

  masterMemberCategoryId: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const MasterItemRowSchema = z.object({
  id: IntSchema,
  name: z.string(),
  code: z.string(),

  masterItemCategoryId: IntSchema,
  masterSupplierId: IntSchema,

  isActive: z.boolean(),
  recordedBuyPrice: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const ItemBranchRowSchema = z.object({
  id: IntSchema,
  recordedStock: IntSchema,
  recordedFrontStock: IntSchema,

  masterItemId: IntSchema,
  branchId: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const MasterItemVariantRowSchema = z.object({
  id: IntSchema,
  unit: z.string(),
  amount: IntSchema,

  recordedBuyPrice: DecimalSchema,
  sellPrice: DecimalSchema,

  masterItemId: IntSchema,
  isBaseUnit: z.boolean(),

  recordedProfitPercentage: DecimalSchema,
  recordedProfitAmount: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const FrontStockTransferRowSchema = z.object({
  id: IntSchema,
  notes: z.string(),
  branchId: IntSchema,
  userId: IntSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const FrontStockTransferItemRowSchema = z.object({
  id: IntSchema,
  amount: IntSchema,
  totalAmount: IntSchema,
  recordedConversion: IntSchema,

  frontStockTransferId: IntSchema,
  masterItemId: IntSchema,
  masterVariantId: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionPurchaseRowSchema = z.object({
  id: IntSchema,
  invoiceNumber: z.string(),
  transactionDate: DateTimeSchema,
  dueDate: DateTimeSchema,
  notes: z.string(),

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTaxPercentage: DecimalSchema,
  recordedTaxAmount: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  masterSupplierId: IntSchema,
  branchId: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionPurchaseItemRowSchema = z.object({
  id: IntSchema,

  transactionPurchaseId: IntSchema,
  masterItemId: IntSchema,
  masterItemVariantId: IntSchema,

  qty: IntSchema,
  recordedConversion: IntSchema,
  totalQty: IntSchema,

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTotalAmount: DecimalSchema,
  recordedAfterTaxAmount: DecimalSchema,

  purchasePrice: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionPurchaseDiscountRowSchema = z.object({
  id: IntSchema,
  orderIndex: IntSchema,

  transactionPurchaseItemId: IntSchema,

  percentage: DecimalSchema,
  recordedAmount: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionPurchaseReturnRowSchema = z.object({
  id: IntSchema,

  transactionPurchaseId: IntSchema,

  invoiceNumber: z.string(),
  transactionDate: DateTimeSchema,
  dueDate: DateTimeSchema,
  notes: z.string(),

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTaxAmount: DecimalSchema,
  recordedTaxPercentage: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  masterSupplierId: IntSchema,
  branchId: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionPurchaseReturnItemRowSchema = z.object({
  id: IntSchema,

  transactionPurchaseReturnId: IntSchema,
  masterItemId: IntSchema,
  masterItemVariantId: IntSchema,

  qty: IntSchema,
  recordedConversion: IntSchema,
  totalQty: IntSchema,

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  purchasePrice: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionPurchaseReturnDiscountRowSchema = z.object({
  id: IntSchema,
  orderIndex: IntSchema,

  transactionPurchaseReturnItemId: IntSchema,

  percentagecentage: z.never().optional(), // (typo guard) optional: remove if you don't want this
  percentage: DecimalSchema,
  recordedAmount: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSalesRowSchema = z.object({
  id: IntSchema,
  invoiceNumber: z.string(),
  notes: z.string(),

  cashReceived: DecimalSchema,
  cashChange: DecimalSchema,

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  masterMemberId: IntSchema.nullable().optional(),
  branchId: IntSchema,

  transactionDate: DateTimeSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSalesItemRowSchema = z.object({
  id: IntSchema,

  transactionSalesId: IntSchema,
  masterItemId: IntSchema,
  masterItemVariantId: IntSchema,

  qty: IntSchema,
  recordedConversion: IntSchema,
  totalQty: IntSchema,

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  salesPrice: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSalesDiscountRowSchema = z.object({
  id: IntSchema,
  orderIndex: IntSchema,

  transactionSalesItemId: IntSchema,

  percentage: DecimalSchema,
  recordedAmount: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSalesReturnRowSchema = z.object({
  id: IntSchema,
  returnNumber: z.string(),

  transactionSalesId: IntSchema,
  notes: z.string(),

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  masterMemberId: IntSchema.nullable().optional(),
  branchId: IntSchema,

  transactionDate: DateTimeSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSalesReturnItemRowSchema = z.object({
  id: IntSchema,

  transactionSalesReturnId: IntSchema,
  masterItemId: IntSchema,
  masterItemVariantId: IntSchema,

  qty: IntSchema,
  recordedConversion: IntSchema,
  totalQty: IntSchema,

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  salesPrice: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSalesReturnDiscountRowSchema = z.object({
  id: IntSchema,
  orderIndex: IntSchema,

  transactionSalesReturnItemId: IntSchema,

  percentage: DecimalSchema,
  recordedAmount: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSellRowSchema = z.object({
  id: IntSchema,
  invoiceNumber: z.string(),
  transactionDate: DateTimeSchema,
  dueDate: DateTimeSchema,
  notes: z.string(),

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTaxAmount: DecimalSchema,
  recordedTaxPercentage: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  masterMemberId: IntSchema,
  branchId: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSellItemRowSchema = z.object({
  id: IntSchema,

  transactionSellId: IntSchema,
  masterItemId: IntSchema,
  masterItemVariantId: IntSchema,

  qty: IntSchema,
  recordedConversion: IntSchema,
  totalQty: IntSchema,

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  sellPrice: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSellDiscountRowSchema = z.object({
  id: IntSchema,
  orderIndex: IntSchema,

  transactionSellItemId: IntSchema,

  percentage: DecimalSchema,
  recordedAmount: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSellReturnRowSchema = z.object({
  id: IntSchema,

  transactionSellId: IntSchema,

  invoiceNumber: z.string(),
  transactionDate: DateTimeSchema,
  dueDate: DateTimeSchema,
  notes: z.string(),

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTaxAmount: DecimalSchema,
  recordedTaxPercentage: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  masterMemberId: IntSchema,
  branchId: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSellReturnItemRowSchema = z.object({
  id: IntSchema,

  transactionSellReturnId: IntSchema,
  masterItemId: IntSchema,
  masterItemVariantId: IntSchema,

  qty: IntSchema,
  recordedConversion: IntSchema,
  totalQty: IntSchema,

  recordedSubTotalAmount: DecimalSchema,
  recordedDiscountAmount: DecimalSchema,
  recordedTotalAmount: DecimalSchema,

  sellPrice: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionSellReturnDiscountRowSchema = z.object({
  id: IntSchema,
  orderIndex: IntSchema,

  transactionSellReturnItemId: IntSchema,

  percentage: DecimalSchema,
  recordedAmount: DecimalSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionTransferRowSchema = z.object({
  id: IntSchema,
  transactionDate: DateTimeSchema,
  notes: z.string(),

  fromId: IntSchema,
  toId: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionTransferItemRowSchema = z.object({
  id: IntSchema,

  transactionTransferId: IntSchema,
  masterItemId: IntSchema,
  masterItemVariantId: IntSchema,

  qty: IntSchema,
  recordedConversion: IntSchema,
  totalQty: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const TransactionAdjustmentRowSchema = z.object({
  id: IntSchema,
  notes: z.string(),

  masterItemId: IntSchema,
  masterItemVariantId: IntSchema,

  recordedGapConversion: IntSchema,

  inputAmount: IntSchema,
  totalGapAmount: IntSchema,
  beforeAmount: IntSchema,
  beforeTotalAmount: IntSchema,
  finalAmount: IntSchema,
  finalTotalAmount: IntSchema,

  branchId: IntSchema,
  transactionDate: DateTimeSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const RecordActionRowSchema = z.object({
  id: IntSchema,

  modelType: RecordActionModelTypeSchema,
  modelId: IntSchema,

  actionType: RecordActionTypeSchema,

  payloadBefore: z.unknown().nullable().optional(),
  payloadAfter: z.unknown().nullable().optional(),

  userId: IntSchema,

  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: NullableDateTime,
});

export const ItemBuyPriceOverrideRowSchema = z.object({
  id: IntSchema,

  masterItemId: IntSchema,
  newBuyPrice: DecimalSchema,
  snapshotStock: IntSchema,

  notes: z.string().nullable().optional(),

  userId: IntSchema,

  createdAt: DateTimeSchema,
});

/** =============== BACKUP FILE V1 =============== */

export const BackupFileV1Schema = z.object({
  meta: z.object({
    schemaVersion: z.literal(1),
    exportedAt: DateTimeSchema,
  }),
  data: z.object({
    // level 0
    branches: z.array(BranchRowSchema),
    users: z.array(UserRowSchema),
    masterItemCategories: z.array(MasterItemCategoryRowSchema),
    masterSuppliers: z.array(MasterSupplierRowSchema),
    masterUnits: z.array(MasterUnitRowSchema),
    masterMemberCategories: z.array(MasterMemberCategoryRowSchema),

    // level 1
    masterMembers: z.array(MasterMemberRowSchema),
    masterItems: z.array(MasterItemRowSchema),
    recordActions: z.array(RecordActionRowSchema),

    // level 2
    masterItemVariants: z.array(MasterItemVariantRowSchema),
    itemBranches: z.array(ItemBranchRowSchema),
    itemBuyPriceOverrides: z.array(ItemBuyPriceOverrideRowSchema),
    frontStockTransfers: z.array(FrontStockTransferRowSchema),

    // level 3
    frontStockTransferItems: z.array(FrontStockTransferItemRowSchema),
    transactionPurchases: z.array(TransactionPurchaseRowSchema),
    transactionPurchaseReturns: z.array(TransactionPurchaseReturnRowSchema),
    transactionSales: z.array(TransactionSalesRowSchema),
    transactionSalesReturns: z.array(TransactionSalesReturnRowSchema),
    transactionSells: z.array(TransactionSellRowSchema),
    transactionSellReturns: z.array(TransactionSellReturnRowSchema),
    transactionTransfers: z.array(TransactionTransferRowSchema),
    transactionAdjustments: z.array(TransactionAdjustmentRowSchema),

    // level 4
    transactionPurchaseItems: z.array(TransactionPurchaseItemRowSchema),
    transactionPurchaseReturnItems: z.array(
      TransactionPurchaseReturnItemRowSchema,
    ),
    transactionSalesItems: z.array(TransactionSalesItemRowSchema),
    transactionSalesReturnItems: z.array(TransactionSalesReturnItemRowSchema),
    transactionSellItems: z.array(TransactionSellItemRowSchema),
    transactionSellReturnItems: z.array(TransactionSellReturnItemRowSchema),
    transactionTransferItems: z.array(TransactionTransferItemRowSchema),

    // level 5
    transactionPurchaseDiscounts: z.array(TransactionPurchaseDiscountRowSchema),
    transactionPurchaseReturnDiscounts: z.array(
      TransactionPurchaseReturnDiscountRowSchema,
    ),
    transactionSalesDiscounts: z.array(TransactionSalesDiscountRowSchema),
    transactionSalesReturnDiscounts: z.array(
      TransactionSalesReturnDiscountRowSchema,
    ),
    transactionSellDiscounts: z.array(TransactionSellDiscountRowSchema),
    transactionSellReturnDiscounts: z.array(
      TransactionSellReturnDiscountRowSchema,
    ),
  }),
});

export type BackupFileV1 = z.infer<typeof BackupFileV1Schema>;
