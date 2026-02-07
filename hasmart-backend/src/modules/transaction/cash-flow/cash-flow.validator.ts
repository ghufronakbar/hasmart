import { z } from "zod";
import { decimalSchema } from "../../../utils/decimal.utils";

export const CashFlowBodySchema = z.object({
  branchId: z.number().int().positive(),
  notes: z.string().min(1, "Notes wajib diisi"),
  amount: decimalSchema.refine((val) => val.isPositive(), {
    message: "Amount harus positif",
  }),
  type: z.enum(["IN", "OUT"]),
  transactionDate: z.coerce.date(),
});

export type CashFlowBodyType = z.infer<typeof CashFlowBodySchema>;

export const CashFlowParamsSchema = z.object({
  id: z.coerce.number(),
});

export type CashFlowParamsType = z.infer<typeof CashFlowParamsSchema>;
