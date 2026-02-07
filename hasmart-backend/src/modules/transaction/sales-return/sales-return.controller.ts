import { BaseController } from "../../../base/base-controller";
import { SalesReturnService } from "./sales-return.service";
import { Request, Response } from "express";
import {
  SalesReturnBodyType,
  SalesReturnParamsType,
} from "./sales-return.validator";

export class SalesReturnController extends BaseController {
  constructor(private service: SalesReturnService) {
    super();
  }

  getAllSalesReturns = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchQuery = req.branchQuery;
    const { rows, pagination } = await this.service.getAllSalesReturns(
      filter,
      branchQuery,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getSalesReturnById = async (req: Request, res: Response) => {
    const params = req.params as unknown as SalesReturnParamsType;
    const data = await this.service.getSalesReturnById(params.salesReturnId);
    return this.sendOk(req, res, data);
  };

  createSalesReturn = async (req: Request, res: Response) => {
    const data = req.body as SalesReturnBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.createSalesReturn(data, userId);
    return this.sendOk(req, res, result);
  };

  updateSalesReturn = async (req: Request, res: Response) => {
    const params = req.params as unknown as SalesReturnParamsType;
    const data = req.body as SalesReturnBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.updateSalesReturn(
      params.salesReturnId,
      data,
      userId,
    );
    return this.sendOk(req, res, result);
  };

  deleteSalesReturn = async (req: Request, res: Response) => {
    const params = req.params as unknown as SalesReturnParamsType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.deleteSalesReturn(
      params.salesReturnId,
      userId,
    );
    return this.sendOk(req, res, result);
  };
}
