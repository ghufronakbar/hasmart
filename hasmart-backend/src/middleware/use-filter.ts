import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/error";
import { z } from "zod";

const FilterQuerySchema = (
  sortCols: string[],
  isTransaction: boolean = false,
) =>
  z.object({
    dateStart: z.coerce
      .date()
      .optional()
      .default(undefined as unknown as Date),
    dateEnd: z.coerce
      .date()
      .optional()
      .default(undefined as unknown as Date),
    search: z.string().default(""),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    sort: z.enum(["asc", "desc"]).default("desc"),
    skip: z.coerce.number().default(0),
    sortBy: z
      .enum(["createdAt", "updatedAt", "id", ...sortCols])
      .default(isTransaction ? "transactionDate" : "id"),
    category: z.string().optional().default(""),
  });

export type FilterQueryType = z.infer<ReturnType<typeof FilterQuerySchema>>;

export const useFilter =
  (sortCols: string[] = [], isTransaction: boolean = false) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query;
      const filter = FilterQuerySchema(sortCols, isTransaction).parse(query);
      filter.skip = (filter.page - 1) * filter.limit;
      req.filterQuery = filter;
      next();
    } catch (err) {
      throw new ValidationError(err);
    }
  };
