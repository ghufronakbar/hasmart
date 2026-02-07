import { BaseController } from "../../../base/base-controller";
import { ReceiptService } from "./receipt.service";
import { Request, Response } from "express";
import { ReceiptParamsType, SalesReceiptQueryType } from "./receipt.validator";

export class ReceiptController extends BaseController {
  constructor(private service: ReceiptService) {
    super();
  }

  getReceipt = async (req: Request, res: Response) => {
    const params = req.params as unknown as ReceiptParamsType;
    const data = await this.service.getReceipt(params);
    return this.sendOk(req, res, data);
  };

  getSalesReceiptByDate = async (req: Request, res: Response) => {
    const params = req.query as unknown as SalesReceiptQueryType;
    const user = req.user;
    const data = await this.service.getSalesReceiptByDate(
      params,
      user?.userId!,
    );
    return this.sendOk(req, res, data);
  };
}
