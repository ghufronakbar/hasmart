import { BaseController } from "../../../base/base-controller";
import { LedgerStockService } from "./ledger-stock.service";
import { Request, Response } from "express";
import { LedgerStockQueryType } from "./ledger-stock.validator";

export class LedgerStockController extends BaseController {
  constructor(private service: LedgerStockService) {
    super();
  }

  getAllLedgerStock = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const params = req.query as unknown as LedgerStockQueryType;
    const { rows, pagination } = await this.service.getAllLedgerStock(
      params,
      filter,
    );
    return this.sendList(req, res, rows, pagination, filter);
  };
}
