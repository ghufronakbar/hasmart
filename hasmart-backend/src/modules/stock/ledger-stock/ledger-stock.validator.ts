import { LedgerStockActionType, LedgerStockModelType } from ".prisma/client";
import { z } from "zod";

export const LedgerStockQuerySchema = z.object({
  branchId: z.coerce.number().optional(), // untuk filter jika ada (jika ada, filter branchId or fromBranchId or toBranchId)
  modelType: z.nativeEnum(LedgerStockModelType).optional(), // untuk filter jika ada
  actionType: z.nativeEnum(LedgerStockActionType).optional(), // untuk filter jika ada
  masterItemId: z.coerce.number().optional(), // untuk filter jika ada
  masterMemberId: z.coerce.number().optional(), // untuk filter jika ada
  masterSupplierId: z.coerce.number().optional(), // untuk filter jika ada
});

export type LedgerStockQueryType = z.infer<typeof LedgerStockQuerySchema>;
