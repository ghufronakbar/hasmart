import { LedgerStockActionType, LedgerStockModelType } from ".prisma/client";
import { z } from "zod";

export const LedgerStockQuerySchema = z.object({
  branchId: z.coerce.number().optional(), // untuk filter jika ada (jika ada, filter branchId or fromBranchId or toBranchId)
  modelType: z.nativeEnum(LedgerStockModelType).optional(), // untuk filter jika ada
  actionType: z.nativeEnum(LedgerStockActionType).optional(), // untuk filter jika ada
  masterItemId: z.coerce.number().optional(), // untuk filter jika ada
  masterMemberId: z.coerce.number().optional(), // untuk filter jika ada
  masterSupplierId: z.coerce.number().optional(), // untuk filter jika ada
  sort: z
    .enum(["createdAt", "transactionDate"])
    .optional()
    .default("createdAt"),
  sortBy: z.enum(["asc", "desc"]).optional().default("desc"),
  dateStart: z.coerce
    .date()
    .optional()
    .default(undefined as unknown as Date),
  dateEnd: z.coerce
    .date()
    .optional()
    .default(undefined as unknown as Date),
});

export type LedgerStockQueryType = z.infer<typeof LedgerStockQuerySchema>;
