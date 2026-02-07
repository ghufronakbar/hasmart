import { BaseController } from "../../../base/base-controller";
import { UnitService } from "./unit.service";
import { Request, Response } from "express";
import { UnitBodyType, UnitParamsType } from "./unit.validator";

export class UnitController extends BaseController {
  constructor(private service: UnitService) {
    super();
  }

  getAllUnits = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const { rows, pagination } = await this.service.getAllUnits(filter);
    return this.sendList(req, res, rows, pagination, filter);
  };

  getUnitById = async (req: Request, res: Response) => {
    const params = req.params as unknown as UnitParamsType;
    const data = await this.service.getUnitById(params.unitId);
    return this.sendOk(req, res, data);
  };

  createUnit = async (req: Request, res: Response) => {
    const data = req.body as UnitBodyType;
    const result = await this.service.createUnit(data);
    return this.sendOk(req, res, result);
  };

  updateUnit = async (req: Request, res: Response) => {
    const params = req.params as unknown as UnitParamsType;
    const data = req.body as UnitBodyType;
    const result = await this.service.updateUnit(params.unitId, data);
    return this.sendOk(req, res, result);
  };

  deleteUnit = async (req: Request, res: Response) => {
    const params = req.params as unknown as UnitParamsType;
    const result = await this.service.deleteUnit(params.unitId);
    return this.sendOk(req, res, result);
  };
}
