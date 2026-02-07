import { BaseController } from "../../../base/base-controller";
import { SellReturnService } from "./sell-return.service";
import { Request, Response } from "express";
import {
  SellReturnBodyType,
  SellReturnParamsType,
} from "./sell-return.validator";

export class SellReturnController extends BaseController {
  constructor(private service: SellReturnService) {
    super();
  }

  getAllSellReturns = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchQuery = req.branchQuery;
    const { rows, pagination } = await this.service.getAllSellReturns(
      filter,
      branchQuery,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getSellReturnById = async (req: Request, res: Response) => {
    const params = req.params as unknown as SellReturnParamsType;
    const data = await this.service.getSellReturnById(params.sellReturnId);
    return this.sendOk(req, res, data);
  };

  createSellReturn = async (req: Request, res: Response) => {
    const data = req.body as SellReturnBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.createSellReturn(data, userId);
    return this.sendOk(req, res, result);
  };

  updateSellReturn = async (req: Request, res: Response) => {
    const params = req.params as unknown as SellReturnParamsType;
    const data = req.body as SellReturnBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.updateSellReturn(
      params.sellReturnId,
      data,
      userId,
    );
    return this.sendOk(req, res, result);
  };

  deleteSellReturn = async (req: Request, res: Response) => {
    const params = req.params as unknown as SellReturnParamsType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.deleteSellReturn(
      params.sellReturnId,
      userId,
    );
    return this.sendOk(req, res, result);
  };
}
