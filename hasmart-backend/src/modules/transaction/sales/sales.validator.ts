import { z } from "zod";
import { decimalSchema, percentageSchema } from "../../../utils/decimal.utils";
import { SalesPaymentType } from ".prisma/client";

const SalesDiscountSchema = z.object({
  percentage: percentageSchema, // CHANGED: Int → Decimal
});

const SalesItemSchema = z.object({
  masterItemVariantId: z.number().int().positive(),
  qty: z.number().int().positive(), // QTY stays as number
  discounts: z.array(SalesDiscountSchema).optional().default([]),
});

export const SalesBodySchema = z.object({
  branchId: z.number().int().positive(),
  notes: z.string().optional().default(""),
  memberCode: z.string().optional().nullable(),
  cashReceived: decimalSchema,
  items: z.array(SalesItemSchema).min(1, "Minimal harus ada 1 item"),
  // paymentType: z.nativeEnum(SalesPaymentType).default(SalesPaymentType.CASH), // nativeEnum sometimes tricky with zod in strict environment if enum not imported well
  // Using enum values directly for safety if nativeEnum fails, or standard approach
  paymentType: z
    .enum([
      SalesPaymentType.CASH,
      SalesPaymentType.DEBIT,
      SalesPaymentType.QRIS,
    ])
    .default(SalesPaymentType.CASH),
});

export type SalesBodyType = z.infer<typeof SalesBodySchema>;
export type SalesItemType = z.infer<typeof SalesItemSchema>;
export type SalesDiscountType = z.infer<typeof SalesDiscountSchema>;

export const SalesParamsSchema = z.object({
  salesId: z.coerce.number(),
});

export type SalesParamsType = z.infer<typeof SalesParamsSchema>;

export const SalesInvoiceParamsSchema = z.object({
  invoiceNumber: z.string().min(1),
});

export type SalesInvoiceParamsType = z.infer<typeof SalesInvoiceParamsSchema>;
