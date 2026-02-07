import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { decimalSchema, percentageSchema } from "../../../utils/decimal.utils";

const SellReturnDiscountSchema = z.object({
  percentage: percentageSchema, // CHANGED: Int → Decimal
});

const SellReturnItemSchema = z.object({
  masterItemVariantId: z.number().int().positive(),
  qty: z.number().int().positive(), // QTY stays as number
  sellPrice: decimalSchema, // CHANGED: Int → Decimal
  discounts: z.array(SellReturnDiscountSchema).optional().default([]),
});

export const SellReturnBodySchema = z.object({
  branchId: z.number().int().positive(),
  transactionDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  memberCode: z.string().min(1, "Member code wajib diisi untuk transaksi B2B"),
  notes: z.string().optional().default(""),
  taxPercentage: percentageSchema.optional().default("0"), // Uses string, transforms to Decimal
  items: z.array(SellReturnItemSchema).min(1, "Minimal harus ada 1 item"),
  originalInvoiceNumber: z
    .string()
    .min(1, "Nomor invoice original wajib diisi"),
});

export type SellReturnBodyType = z.infer<typeof SellReturnBodySchema>;
export type SellReturnItemType = z.infer<typeof SellReturnItemSchema>;
export type SellReturnDiscountType = z.infer<typeof SellReturnDiscountSchema>;

export const SellReturnParamsSchema = z.object({
  sellReturnId: z.coerce.number(),
});

export type SellReturnParamsType = z.infer<typeof SellReturnParamsSchema>;
