import { z } from "zod";
import { decimalSchema, percentageSchema } from "../../../utils/decimal.utils";

const PurchaseReturnDiscountSchema = z.object({
  percentage: percentageSchema, // CHANGED: Int → Decimal
});

const PurchaseReturnItemSchema = z.object({
  masterItemVariantId: z.number().int().positive(),
  qty: z.number().int().positive(), // QTY stays as number
  purchasePrice: decimalSchema, // CHANGED: Int → Decimal
  discounts: z.array(PurchaseReturnDiscountSchema).optional().default([]),
});

export const PurchaseReturnBodySchema = z.object({
  invoiceNumber: z.string().min(1),
  originalInvoiceNumber: z.string().min(1),
  transactionDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  masterSupplierId: z.number().int().positive(),
  branchId: z.number().int().positive(),
  notes: z.string().optional().default(""),
  taxPercentage: percentageSchema, // CHANGED: Int → Decimal
  items: z.array(PurchaseReturnItemSchema).min(1, "Minimal harus ada 1 item"),
});

export type PurchaseReturnBodyType = z.infer<typeof PurchaseReturnBodySchema>;
export type PurchaseReturnItemType = z.infer<typeof PurchaseReturnItemSchema>;
export type PurchaseReturnDiscountType = z.infer<
  typeof PurchaseReturnDiscountSchema
>;

export const PurchaseReturnParamsSchema = z.object({
  purchaseReturnId: z.coerce.number(),
});

export type PurchaseReturnParamsType = z.infer<
  typeof PurchaseReturnParamsSchema
>;
