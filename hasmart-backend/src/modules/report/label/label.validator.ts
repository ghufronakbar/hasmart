import { ValidationError } from "../../../utils/error";
import { z } from "zod";

export const LabelQuerySchema = z.object({
  masterItemIds: z.string().transform((s) => {
    // undefined => undefined
    if (s == null) return [];

    const trimmed = s.trim();

    // string kosong => undefined
    if (trimmed === "") return [];

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
  onlyBaseUnit: z
    .string()
    .optional()
    .transform((s) => {
      return s === "true";
    }),
});

export type LabelQueryParamsType = z.infer<typeof LabelQuerySchema>;
