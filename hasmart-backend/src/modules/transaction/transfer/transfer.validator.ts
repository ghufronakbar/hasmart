import { z } from "zod";

const TransferItemSchema = z.object({
  masterItemVariantId: z.number().int().positive(),
  qty: z.number().int().positive(),
});

export const TransferBodySchema = z
  .object({
    transactionDate: z.coerce.date(),
    fromId: z.number().int().positive(),
    toId: z.number().int().positive(),
    notes: z.string().optional().default(""),
    items: z.array(TransferItemSchema).min(1, "Minimal harus ada 1 item"),
  })
  .refine((data) => data.fromId !== data.toId, {
    message: "Cabang pengirim dan penerima tidak boleh sama",
    path: ["toId"],
  });

export type TransferBodyType = z.infer<typeof TransferBodySchema>;
export type TransferItemType = z.infer<typeof TransferItemSchema>;

export const TransferParamsSchema = z.object({
  transferId: z.coerce.number(),
});

export type TransferParamsType = z.infer<typeof TransferParamsSchema>;
