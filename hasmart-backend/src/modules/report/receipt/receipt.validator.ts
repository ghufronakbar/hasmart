import { z } from "zod";

export const ReceiptParamsSchema = z.object({
  receiptId: z.coerce.number(),
  type: z.enum(["sales", "sell"]),
});

export type ReceiptParamsType = z.infer<typeof ReceiptParamsSchema>;

export const SalesReceiptQuerySchema = z.object({
  date: z.coerce.date(),
  branchId: z.coerce.number(),
});

export type SalesReceiptQueryType = z.infer<typeof SalesReceiptQuerySchema>;
