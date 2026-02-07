import { z } from "zod";

export const MemberCategoryBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  color: z
    .string()
    .length(6)
    .regex(/^[0-9A-Fa-f]{6}$/, "Color must be valid hex"),
});

export type MemberCategoryBodyType = z.infer<typeof MemberCategoryBodySchema>;

export const MemberCategoryParamsSchema = z.object({
  memberCategoryId: z.coerce.number(),
});

export type MemberCategoryParamsType = z.infer<
  typeof MemberCategoryParamsSchema
>;

export const MemberCategoryCodeParamsSchema = z.object({
  code: z.string().min(1),
});

export type MemberCategoryCodeParamsType = z.infer<
  typeof MemberCategoryCodeParamsSchema
>;
