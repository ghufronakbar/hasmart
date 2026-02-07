import { BaseController } from "../../../base/base-controller";
import { SalesService } from "./sales.service";
import { Request, Response } from "express";
import {
  SalesBodyType,
  SalesParamsType,
  SalesInvoiceParamsType,
} from "./sales.validator";

export class SalesController extends BaseController {
  constructor(private service: SalesService) {
    super();
  }

  getAllSales = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchQuery = req.branchQuery;
    const { rows, pagination } = await this.service.getAllSales(
      filter,
      branchQuery,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getSalesById = async (req: Request, res: Response) => {
    const params = req.params as unknown as SalesParamsType;
    const data = await this.service.getSalesById(params.salesId);
    return this.sendOk(req, res, data);
  };

  getSalesByInvoice = async (req: Request, res: Response) => {
    const params = req.params as unknown as SalesInvoiceParamsType;
    const data = await this.service.getSalesByInvoice(params.invoiceNumber);
    return this.sendOk(req, res, data);
  };

  createSales = async (req: Request, res: Response) => {
    const data = req.body as SalesBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.createSales(data, userId);
    return this.sendOk(req, res, result);
  };

  updateSales = async (req: Request, res: Response) => {
    const params = req.params as unknown as SalesParamsType;
    const data = req.body as SalesBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.updateSales(params.salesId, data, userId);
    return this.sendOk(req, res, result);
  };

  deleteSales = async (req: Request, res: Response) => {
    const params = req.params as unknown as SalesParamsType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.deleteSales(params.salesId, userId);
    return this.sendOk(req, res, result);
  };
}
