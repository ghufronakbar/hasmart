import { z } from "zod";

export const BranchBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  fax: z.string().optional().nullable(),
  npwp: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  receiptSize: z.string().optional().nullable(),
  receiptFooter: z.string().optional().nullable(),
  receiptPrinter: z.string().optional().nullable(),
  labelBarcodePrinter: z.string().optional().nullable(),
  reportPrinter: z.string().optional().nullable(),
});

export type BranchBodyType = z.infer<typeof BranchBodySchema>;

export const BranchParamsSchema = z.object({
  branchId: z.coerce.number(),
});

export type BranchParamsType = z.infer<typeof BranchParamsSchema>;
