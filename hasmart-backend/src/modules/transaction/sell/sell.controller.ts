import { BaseController } from "../../../base/base-controller";
import { SellService } from "./sell.service";
import { Request, Response } from "express";
import {
  SellBodyType,
  SellParamsType,
  SellInvoiceParamsType,
} from "./sell.validator";

export class SellController extends BaseController {
  constructor(private service: SellService) {
    super();
  }

  getAllSells = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchQuery = req.branchQuery;
    const { rows, pagination } = await this.service.getAllSells(
      filter,
      branchQuery,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getSellById = async (req: Request, res: Response) => {
    const params = req.params as unknown as SellParamsType;
    const data = await this.service.getSellById(params.sellId);
    return this.sendOk(req, res, data);
  };

  getSellByInvoice = async (req: Request, res: Response) => {
    const params = req.params as unknown as SellInvoiceParamsType;
    const data = await this.service.getSellByInvoice(params.invoiceNumber);
    return this.sendOk(req, res, data);
  };

  createSell = async (req: Request, res: Response) => {
    const data = req.body as SellBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.createSell(data, userId);
    return this.sendOk(req, res, result);
  };

  updateSell = async (req: Request, res: Response) => {
    const params = req.params as unknown as SellParamsType;
    const data = req.body as SellBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.updateSell(params.sellId, data, userId);
    return this.sendOk(req, res, result);
  };

  deleteSell = async (req: Request, res: Response) => {
    const params = req.params as unknown as SellParamsType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.deleteSell(params.sellId, userId);
    return this.sendOk(req, res, result);
  };
}
