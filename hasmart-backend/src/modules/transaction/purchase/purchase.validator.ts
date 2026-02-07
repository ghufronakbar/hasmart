import { z } from "zod";
import { decimalSchema, percentageSchema } from "../../../utils/decimal.utils";

const PurchaseDiscountSchema = z.object({
  percentage: percentageSchema, // CHANGED: Int → Decimal
});

const PurchaseItemSchema = z.object({
  masterItemVariantId: z.number().int().positive(),
  qty: z.number().int().positive(), // QTY stays as number
  purchasePrice: decimalSchema, // CHANGED: Int → Decimal
  discounts: z.array(PurchaseDiscountSchema).optional().default([]),
});

export const PurchaseBodySchema = z.object({
  invoiceNumber: z.string().min(1),
  transactionDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  masterSupplierCode: z.string().min(1, "Kode supplier wajib"),
  branchId: z.number().int().positive(),
  notes: z.string().optional().default(""),
  taxPercentage: percentageSchema, // CHANGED: Int → Decimal
  items: z.array(PurchaseItemSchema).min(1, "Minimal harus ada 1 item"),
});

export type PurchaseBodyType = z.infer<typeof PurchaseBodySchema>;
export type PurchaseItemType = z.infer<typeof PurchaseItemSchema>;
export type PurchaseDiscountType = z.infer<typeof PurchaseDiscountSchema>;

export const PurchaseParamsSchema = z.object({
  purchaseId: z.coerce.number(),
});

export type PurchaseParamsType = z.infer<typeof PurchaseParamsSchema>;

export const PurchaseInvoiceParamsSchema = z.object({
  invoiceNumber: z.string().min(1),
});

export type PurchaseInvoiceParamsType = z.infer<
  typeof PurchaseInvoiceParamsSchema
>;
