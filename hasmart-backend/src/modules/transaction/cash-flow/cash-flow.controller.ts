import { BaseController } from "../../../base/base-controller";
import { CashFlowService } from "./cash-flow.service";
import { Request, Response } from "express";
import { CashFlowBodyType, CashFlowParamsType } from "./cash-flow.validator";

export class CashFlowController extends BaseController {
  constructor(private service: CashFlowService) {
    super();
  }

  getAllCashFlows = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchQuery = req.branchQuery;
    const { rows, pagination } = await this.service.getAllCashFlows(
      filter,
      branchQuery,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getCashFlowById = async (req: Request, res: Response) => {
    const params = req.params as unknown as CashFlowParamsType;
    const result = await this.service.getCashFlowById(params.id);
    return this.sendOk(req, res, result);
  };

  createCashFlow = async (req: Request, res: Response) => {
    const data = req.body as CashFlowBodyType;
    const userId = req.user?.userId;
    const result = await this.service.createCashFlow(data, userId!);
    return this.sendOk(req, res, result);
  };

  updateCashFlow = async (req: Request, res: Response) => {
    const params = req.params as unknown as CashFlowParamsType;
    const data = req.body as CashFlowBodyType;
    const userId = req.user?.userId;
    const result = await this.service.updateCashFlow(params.id, data, userId!);
    return this.sendOk(req, res, result);
  };

  deleteCashFlow = async (req: Request, res: Response) => {
    const params = req.params as unknown as CashFlowParamsType;
    const userId = req.user?.userId;
    const result = await this.service.deleteCashFlow(params.id, userId!);
    return this.sendOk(req, res, result);
  };
}
