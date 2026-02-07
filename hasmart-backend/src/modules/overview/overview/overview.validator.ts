import { z } from "zod";

// No specific body schema needed - this is a read-only module
// Query params are handled by useFilter middleware

// Params schema for future use if needed
export const OverviewParamsSchema = z.object({
  // Reserved for future use
});

export type OverviewParamsType = z.infer<typeof OverviewParamsSchema>;
