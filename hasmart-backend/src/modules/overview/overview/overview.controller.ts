import { BaseController } from "../../../base/base-controller";
import { OverviewService } from "./overview.service";
import { Request, Response } from "express";

export class OverviewController extends BaseController {
  constructor(private service: OverviewService) {
    super();
  }

  getFinancialSummary = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchId = req.branchQuery?.branchId;
    const data = await this.service.getFinancialSummary(filter, branchId);
    return this.sendOk(req, res, data);
  };

  getSalesTrend = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchId = req.branchQuery?.branchId;
    const data = await this.service.getSalesTrend(filter, branchId);
    return this.sendOk(req, res, data);
  };

  getTopProducts = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchId = req.branchQuery?.branchId;
    const data = await this.service.getTopProducts(filter, branchId);
    return this.sendOk(req, res, data);
  };

  getStockAlerts = async (req: Request, res: Response) => {
    const branchId = req.branchQuery?.branchId;
    const data = await this.service.getStockAlerts(branchId);
    return this.sendOk(req, res, data);
  };
}
