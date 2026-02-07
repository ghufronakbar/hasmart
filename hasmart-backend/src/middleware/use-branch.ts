import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/error";
import { z } from "zod";

const BranchQuerySchema = z.object({
  branchId: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().optional(),
  ),
});

export type BranchQueryType = z.infer<typeof BranchQuerySchema>;

export const useBranch =
  () => (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query;
      const filter = BranchQuerySchema.parse(query);
      req.branchQuery = filter;
      next();
    } catch (err) {
      throw new ValidationError(err);
    }
  };
