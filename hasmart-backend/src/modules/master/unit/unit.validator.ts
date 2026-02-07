import { z } from "zod";

export const UnitBodySchema = z.object({
  unit: z.string().min(1),
  name: z.string().min(1),
});

export type UnitBodyType = z.infer<typeof UnitBodySchema>;

export const UnitParamsSchema = z.object({
  unitId: z.coerce.number(),
});

export type UnitParamsType = z.infer<typeof UnitParamsSchema>;
