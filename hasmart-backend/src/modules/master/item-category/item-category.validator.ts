import { z } from "zod";

export const ItemCategoryBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});

export type ItemCategoryBodyType = z.infer<typeof ItemCategoryBodySchema>;

export const ItemCategoryParamsSchema = z.object({
  itemCategoryId: z.coerce.number(),
});

export type ItemCategoryParamsType = z.infer<typeof ItemCategoryParamsSchema>;
