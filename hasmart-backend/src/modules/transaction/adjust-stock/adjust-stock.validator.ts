import { z } from "zod";

const AdjustmentItemSchema = z.object({
  masterItemVariantId: z.number().int().positive(),
  actualQty: z.number().int().min(0), // Jumlah fisik yang dihitung user
});

export const AdjustmentBodySchema = z.object({
  branchId: z.number().int().positive(),
  notes: z.string().optional().default(""),
  items: z.array(AdjustmentItemSchema).min(1, "Minimal harus ada 1 item"),
  transactionDate: z.coerce.date(),
});

export type AdjustmentBodyType = z.infer<typeof AdjustmentBodySchema>;
export type AdjustmentItemType = z.infer<typeof AdjustmentItemSchema>;

export const AdjustmentParamsSchema = z.object({
  adjustmentId: z.coerce.number(),
});

export type AdjustmentParamsType = z.infer<typeof AdjustmentParamsSchema>;
