import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { percentageSchema } from "../../../utils/decimal.utils";

const SellDiscountSchema = z.object({
  percentage: percentageSchema, // CHANGED: Int → Decimal
});

const SellItemSchema = z.object({
  masterItemVariantId: z.number().int().positive(),
  qty: z.number().int().positive(), // QTY stays as number
  discounts: z.array(SellDiscountSchema).optional().default([]),
});

export const SellBodySchema = z.object({
  branchId: z.number().int().positive(),
  transactionDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  memberCode: z.string().min(1, "Member code wajib diisi untuk transaksi B2B"),
  notes: z.string().optional().default(""),
  taxPercentage: percentageSchema.optional().default("0"), // Uses string, transforms to Decimal
  items: z.array(SellItemSchema).min(1, "Minimal harus ada 1 item"),
});

export type SellBodyType = z.infer<typeof SellBodySchema>;
export type SellItemType = z.infer<typeof SellItemSchema>;
export type SellDiscountType = z.infer<typeof SellDiscountSchema>;

export const SellParamsSchema = z.object({
  sellId: z.coerce.number(),
});

export type SellParamsType = z.infer<typeof SellParamsSchema>;

export const SellInvoiceParamsSchema = z.object({
  invoiceNumber: z.string().min(1),
});

export type SellInvoiceParamsType = z.infer<typeof SellInvoiceParamsSchema>;
