import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

/**
 * Zod schema that transforms string/number input to Prisma Decimal
 * Use for: price, amount (money), totalAmount fields
 */
export const decimalSchema = z
  .union([z.string(), z.number()])
  .transform((val) => new Decimal(val));

/**
 * Zod schema for percentage values (0-100)
 * Transforms to Decimal and validates range
 */
export const percentageSchema = z
  .union([z.string(), z.number()])
  .transform((val) => new Decimal(val))
  .refine(
    (d) => d.gte(0) && d.lte(100),
    "Percentage must be between 0 and 100",
  );

/**
 * Helper to safely get Decimal from nullable aggregate result
 */
export const safeDecimal = (value: Decimal | null | undefined): Decimal => {
  return value ?? new Decimal(0);
};

/**
 * Format Decimal to string with 2 decimal places for API response
 */
export const formatDecimal = (value: Decimal): string => {
  return value.toFixed(2);
};

/**
 * Format Decimal percentage to string with 2 decimal places
 */
export const formatPercentage = (value: Decimal): string => {
  return value.toFixed(2);
};
