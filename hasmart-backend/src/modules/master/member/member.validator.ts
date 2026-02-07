import { z } from "zod";

export const MemberBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  masterMemberCategoryId: z.number().int().positive(),
});

export type MemberBodyType = z.infer<typeof MemberBodySchema>;

export const MemberParamsSchema = z.object({
  memberId: z.coerce.number(),
});

export type MemberParamsType = z.infer<typeof MemberParamsSchema>;

export const MemberCodeParamsSchema = z.object({
  code: z.string().min(1),
});

export type MemberCodeParamsType = z.infer<typeof MemberCodeParamsSchema>;
