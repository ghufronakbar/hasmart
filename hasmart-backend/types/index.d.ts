import { FilterQueryType } from "src/middleware/use-filter";
import { AppUser } from "../utils/auth";
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      filterQuery?: FilterQueryType;
      branchQuery?: BranchQueryType;
    }
  }
}
