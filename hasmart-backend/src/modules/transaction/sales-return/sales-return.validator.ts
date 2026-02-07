import { z } from "zod";
import { decimalSchema, percentageSchema } from "../../../utils/decimal.utils";

const SalesReturnDiscountSchema = z.object({
  percentage: percentageSchema, // CHANGED: Int → Decimal
});

const SalesReturnItemSchema = z.object({
  masterItemVariantId: z.number().int().positive(),
  qty: z.number().int().positive(), // QTY stays as number
  salesPrice: decimalSchema, // CHANGED: Int → Decimal
  discounts: z.array(SalesReturnDiscountSchema).optional().default([]),
});

export const SalesReturnBodySchema = z.object({
  transactionDate: z.coerce.date(),
  branchId: z.number().int().positive(),
  originalInvoiceNumber: z.string().min(1, "Nomor invoice asli wajib diisi"),
  notes: z.string().optional().default(""),
  items: z.array(SalesReturnItemSchema).min(1, "Minimal harus ada 1 item"),
});

export type SalesReturnBodyType = z.infer<typeof SalesReturnBodySchema>;
export type SalesReturnItemType = z.infer<typeof SalesReturnItemSchema>;
export type SalesReturnDiscountType = z.infer<typeof SalesReturnDiscountSchema>;

export const SalesReturnParamsSchema = z.object({
  salesReturnId: z.coerce.number(),
});

export type SalesReturnParamsType = z.infer<typeof SalesReturnParamsSchema>;
