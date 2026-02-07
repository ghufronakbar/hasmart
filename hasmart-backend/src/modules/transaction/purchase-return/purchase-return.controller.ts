import { BaseController } from "../../../base/base-controller";
import { PurchaseReturnService } from "./purchase-return.service";
import { Request, Response } from "express";
import {
  PurchaseReturnBodyType,
  PurchaseReturnParamsType,
} from "./purchase-return.validator";

export class PurchaseReturnController extends BaseController {
  constructor(private service: PurchaseReturnService) {
    super();
  }

  getAllPurchaseReturns = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchQuery = req.branchQuery;
    const { rows, pagination } = await this.service.getAllPurchaseReturns(
      filter,
      branchQuery,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getPurchaseReturnById = async (req: Request, res: Response) => {
    const params = req.params as unknown as PurchaseReturnParamsType;
    const data = await this.service.getPurchaseReturnById(
      params.purchaseReturnId,
    );
    return this.sendOk(req, res, data);
  };

  createPurchaseReturn = async (req: Request, res: Response) => {
    const data = req.body as PurchaseReturnBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.createPurchaseReturn(data, userId);
    return this.sendOk(req, res, result);
  };

  updatePurchaseReturn = async (req: Request, res: Response) => {
    const params = req.params as unknown as PurchaseReturnParamsType;
    const data = req.body as PurchaseReturnBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.updatePurchaseReturn(
      params.purchaseReturnId,
      data,
      userId,
    );
    return this.sendOk(req, res, result);
  };

  deletePurchaseReturn = async (req: Request, res: Response) => {
    const params = req.params as unknown as PurchaseReturnParamsType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.deletePurchaseReturn(
      params.purchaseReturnId,
      userId,
    );
    return this.sendOk(req, res, result);
  };
}
