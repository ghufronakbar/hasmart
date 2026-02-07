import { ValidationError } from "../../../utils/error";
import { z } from "zod";
import { decimalSchema } from "../../../utils/decimal.utils";

// Item Validators
export const ItemBodySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  masterSupplierCode: z.string().min(1),
  masterItemCategoryCode: z.string().min(1),
  isActive: z.boolean().default(true),
  masterItemVariants: z
    .array(
      z.object({
        unit: z.string().min(1),
        amount: z.number().int().positive(),
        sellPrice: decimalSchema,
      }),
    )
    .min(1, "Minimal harus ada 1 variant"),
});

export type ItemBodyType = z.infer<typeof ItemBodySchema>;

export const MasterItemVariantUpdateSchema = z
  .object({
    id: z.number().optional(),
    unit: z.string().min(1),
    amount: z.number().int().positive(),
    sellPrice: decimalSchema,
    action: z.enum(["create", "update", "delete"]),
  })
  .refine((variant) => {
    // jika create tidak usah kirim id
    if (variant.action === "create") {
      return variant.id === undefined;
    }
    // jika update harus kirim id
    if (variant.action === "update") {
      return variant.id !== undefined;
    }
    // jika delete harus kirim id
    if (variant.action === "delete") {
      return variant.id !== undefined;
    }
    return true;
  });

export type MasterItemVariantUpdateType = z.infer<
  typeof MasterItemVariantUpdateSchema
>;

export const ItemUpdateBodySchema = z.object({
  name: z.string().min(1),
  masterSupplierCode: z.string().min(1),
  masterItemCategoryCode: z.string().min(1),
  isActive: z.boolean(),
  buyPrice: decimalSchema,
  masterItemVariants: z
    .array(MasterItemVariantUpdateSchema)
    .min(1, "Minimal harus ada 1 variant"),
});

export type ItemUpdateBodyType = z.infer<typeof ItemUpdateBodySchema>;

export const ItemParamsSchema = z.object({
  masterItemId: z.coerce.number(),
});

export type ItemParamsType = z.infer<typeof ItemParamsSchema>;

export const ItemQuerySchema = z.object({
  onlyActive: z
    .string()
    .optional()
    .transform((v) => (v?.trim().toLowerCase() === "true" ? true : undefined)),
  idNotIns: z
    .string()
    .optional()
    .transform((s) => {
      // undefined => undefined
      if (s == null) return undefined;

      const trimmed = s.trim();

      // string kosong => undefined
      if (trimmed === "") return undefined;

      const parts = trimmed.split(",").map((x) => x.trim());

      // token kosong => error (mis: "1,,2" atau "1,2,")
      if (parts.some((p) => p === "")) {
        throw new ValidationError(
          "idNotIns harus berisi angka dengan separator koma",
        );
      }

      // harus integer
      const nums = parts.map((p) => {
        if (!/^-?\d+$/.test(p)) {
          throw new ValidationError(`Invalid number: "${p}"`);
        }
        return Number(p);
      });

      // dedupe + sort (hapus kalau tidak perlu)
      return Array.from(new Set(nums)).sort((a, b) => a - b);
    }),
});

export type ItemQueryType = z.infer<typeof ItemQuerySchema>;

export const GetItemByCodeParamsSchema = z.object({
  code: z.string().min(1),
});

export type GetItemByCodeParamsType = z.infer<typeof GetItemByCodeParamsSchema>;

// BULK UPDATE VARIANT PRICE

export const ItemBulkUpdateVariantPriceBodySchema = z.object({
  masterItemVariants: z
    .array(z.number().int().positive())
    .min(1, "Minimal harus ada 1 variant"),
  sellPrice: decimalSchema,
});

export type ItemBulkUpdateVariantPriceBodyType = z.infer<
  typeof ItemBulkUpdateVariantPriceBodySchema
>;
