import { BranchService } from "./branch.service";
import { Request, Response } from "express";
import { BaseController } from "../../../base/base-controller";
import { BranchBodyType, BranchParamsType } from "./brach.validator";

export class BranchController extends BaseController {
  constructor(private service: BranchService) {
    super();
  }

  getAllBranches = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const { rows, pagination } = await this.service.getAllBranches(filter);
    return this.sendList(req, res, rows, pagination, filter);
  };

  getBranchById = async (req: Request, res: Response) => {
    const params = req.params as unknown as BranchParamsType;
    const branch = await this.service.getBranchById(params.branchId);
    return this.sendOk(req, res, branch);
  };

  createBranch = async (req: Request, res: Response) => {
    const data = req.body as BranchBodyType;
    const branch = await this.service.createBranch(data);
    return this.sendOk(req, res, branch);
  };

  updateBranch = async (req: Request, res: Response) => {
    const params = req.params as unknown as BranchParamsType;
    const data = req.body as BranchBodyType;
    const branch = await this.service.updateBranch(params.branchId, data);
    return this.sendOk(req, res, branch);
  };

  deleteBranch = async (req: Request, res: Response) => {
    const params = req.params as unknown as BranchParamsType;
    const branch = await this.service.deleteBranch(params.branchId);
    return this.sendOk(req, res, branch);
  };
}
