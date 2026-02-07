import { BaseController } from "../../../base/base-controller";
import { TransferService } from "./transfer.service";
import { Request, Response } from "express";
import { TransferBodyType, TransferParamsType } from "./transfer.validator";

export class TransferController extends BaseController {
  constructor(private service: TransferService) {
    super();
  }

  getAllTransfers = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const branchQuery = req.branchQuery;
    const { rows, pagination } = await this.service.getAllTransfers(
      filter,
      branchQuery,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };

  getTransferById = async (req: Request, res: Response) => {
    const params = req.params as unknown as TransferParamsType;
    const data = await this.service.getTransferById(params.transferId);
    return this.sendOk(req, res, data);
  };

  createTransfer = async (req: Request, res: Response) => {
    const data = req.body as TransferBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.createTransfer(data, userId);
    return this.sendOk(req, res, result);
  };

  updateTransfer = async (req: Request, res: Response) => {
    const params = req.params as unknown as TransferParamsType;
    const data = req.body as TransferBodyType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.updateTransfer(
      params.transferId,
      data,
      userId,
    );
    return this.sendOk(req, res, result);
  };

  deleteTransfer = async (req: Request, res: Response) => {
    const params = req.params as unknown as TransferParamsType;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const result = await this.service.deleteTransfer(params.transferId, userId);
    return this.sendOk(req, res, result);
  };
}
