import { BaseController } from "../../../base/base-controller";
import { AdjustStockService } from "./adjust-stock.service";
import { Request, Response } from "express";
import {
  AdjustmentBodyType,
  AdjustmentParamsType,
} from "./adjust-stock.validator";

export class AdjustStockController extends BaseController {
  constructor(private service: AdjustStockService) {
    super();
  }

  getAllAdjustments = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchQuery = req.branchQuery;
    const { rows, pagination } = await this.service.getAllAdjustments(
      filter,
      branchQuery,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getAdjustmentById = async (req: Request, res: Response) => {
    const params = req.params as unknown as AdjustmentParamsType;
    const data = await this.service.getAdjustmentById(params.adjustmentId);
    return this.sendOk(req, res, data);
  };

  createAdjustment = async (req: Request, res: Response) => {
    const data = req.body as AdjustmentBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.createAdjustment(data, userId);
    return this.sendOk(req, res, result);
  };

  deleteAdjustment = async (req: Request, res: Response) => {
    const params = req.params as unknown as AdjustmentParamsType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.deleteAdjustment(
      params.adjustmentId,
      userId,
    );
    return this.sendOk(req, res, result);
  };
}
