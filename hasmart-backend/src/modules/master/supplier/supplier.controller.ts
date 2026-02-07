import { BaseController } from "../../../base/base-controller";
import { SupplierService } from "./supplier.service";
import { Request, Response } from "express";
import { SupplierBodyType, SupplierParamsType } from "./supplier.validator";

export class SupplierController extends BaseController {
  constructor(private service: SupplierService) {
    super();
  }

  getAllSuppliers = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const { rows, pagination } = await this.service.getAllSuppliers(filter);
    return this.sendList(req, res, rows, pagination, filter);
  };

  getSupplierById = async (req: Request, res: Response) => {
    const params = req.params as unknown as SupplierParamsType;
    const data = await this.service.getSupplierById(params.supplierId);
    return this.sendOk(req, res, data);
  };

  createSupplier = async (req: Request, res: Response) => {
    const data = req.body as SupplierBodyType;
    const result = await this.service.createSupplier(data);
    return this.sendOk(req, res, result);
  };

  updateSupplier = async (req: Request, res: Response) => {
    const params = req.params as unknown as SupplierParamsType;
    const data = req.body as SupplierBodyType;
    const result = await this.service.updateSupplier(params.supplierId, data);
    return this.sendOk(req, res, result);
  };

  deleteSupplier = async (req: Request, res: Response) => {
    const params = req.params as unknown as SupplierParamsType;
    const result = await this.service.deleteSupplier(params.supplierId);
    return this.sendOk(req, res, result);
  };
}
