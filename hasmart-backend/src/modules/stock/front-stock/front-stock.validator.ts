import { z } from "zod";

export const FrontStockItemBodySchema = z.object({
  masterVariantId: z.number(),
  transferAmount: z.number(), // amount dalam variant
  // jika ada barang dari belakang yang dipindah ke depan (ditambah/dikurangi berapa) // tidak mempengaruhi recordedStock asli
});

export type FrontStockItemBodyType = z.infer<typeof FrontStockItemBodySchema>;

export const FrontStockBodySchema = z.object({
  branchId: z.number(),
  notes: z.string().optional(),
  items: z.array(FrontStockItemBodySchema),
});

export type FrontStockBodyType = z.infer<typeof FrontStockBodySchema>;

export const FrontStockParamsSchema = z.object({
  branchId: z.coerce.number(),
});

export type FrontStockParamsType = z.infer<typeof FrontStockParamsSchema>;

export const FrontStockTransferParamsSchema = z.object({
  frontStockTransferId: z.coerce.number(),
});

export type FrontStockTransferParamsType = z.infer<
  typeof FrontStockTransferParamsSchema
>;
