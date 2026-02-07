import { BaseController } from "../../../base/base-controller";
import { FrontStockService } from "./front-stock.service";
import { Request, Response } from "express";
import {
  FrontStockBodyType,
  FrontStockParamsType,
  FrontStockTransferParamsType,
} from "./front-stock.validator";

export class FrontStockController extends BaseController {
  constructor(private service: FrontStockService) {
    super();
  }

  getAllItemWithFrontStock = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const params = req.query as unknown as FrontStockParamsType;
    const { rows, pagination } = await this.service.getAllItemWithFrontStock(
      params,
      filter,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getAllFrontStockTransfers = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const params = req.query as unknown as FrontStockParamsType;
    const { rows, pagination } = await this.service.getAllFrontStockTransfers(
      params,
      filter,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  createFrontStockTransfer = async (req: Request, res: Response) => {
    const data = req.body as FrontStockBodyType;
    const userId = req.user?.userId;
    const result = await this.service.createFrontStock(data, userId!);
    return this.sendOk(req, res, result);
  };

  deleteFrontStockTransfer = async (req: Request, res: Response) => {
    const params = req.params as unknown as FrontStockTransferParamsType;
    const result = await this.service.deleteFrontStock(
      params.frontStockTransferId,
    );
    return this.sendOk(req, res, result);
  };
}
