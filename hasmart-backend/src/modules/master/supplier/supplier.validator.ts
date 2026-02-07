import { z } from "zod";

export const SupplierBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

export type SupplierBodyType = z.infer<typeof SupplierBodySchema>;

export const SupplierParamsSchema = z.object({
  supplierId: z.coerce.number(),
});

export type SupplierParamsType = z.infer<typeof SupplierParamsSchema>;
