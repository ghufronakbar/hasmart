import { BaseController } from "../../../base/base-controller";
import { PurchaseService } from "./purchase.service";
import { Request, Response } from "express";
import {
  PurchaseBodyType,
  PurchaseParamsType,
  PurchaseInvoiceParamsType,
} from "./purchase.validator";

export class PurchaseController extends BaseController {
  constructor(private service: PurchaseService) {
    super();
  }

  getAllPurchases = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchQuery = req.branchQuery;
    const { rows, pagination } = await this.service.getAllPurchases(
      filter,
      branchQuery,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getPurchaseById = async (req: Request, res: Response) => {
    const params = req.params as unknown as PurchaseParamsType;
    const data = await this.service.getPurchaseById(params.purchaseId);
    return this.sendOk(req, res, data);
  };

  getPurchaseByInvoice = async (req: Request, res: Response) => {
    const params = req.params as unknown as PurchaseInvoiceParamsType;
    const data = await this.service.getPurchaseByInvoice(params.invoiceNumber);
    return this.sendOk(req, res, data);
  };

  createPurchase = async (req: Request, res: Response) => {
    const data = req.body as PurchaseBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.createPurchase(data, userId);
    return this.sendOk(req, res, result);
  };

  updatePurchase = async (req: Request, res: Response) => {
    const params = req.params as unknown as PurchaseParamsType;
    const data = req.body as PurchaseBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.updatePurchase(
      params.purchaseId,
      data,
      userId,
    );
    return this.sendOk(req, res, result);
  };

  deletePurchase = async (req: Request, res: Response) => {
    const params = req.params as unknown as PurchaseParamsType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.deletePurchase(params.purchaseId, userId);
    return this.sendOk(req, res, result);
  };
}
