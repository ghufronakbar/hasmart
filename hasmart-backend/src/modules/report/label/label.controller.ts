import { BaseController } from "../../../base/base-controller";
import { LabelService } from "./label.service";
import { Request, Response } from "express";
import { LabelQueryParamsType } from "./label.validator";

export class LabelController extends BaseController {
  constructor(private service: LabelService) {
    super();
  }

  getLabel = async (req: Request, res: Response) => {
    const params = req.query as unknown as LabelQueryParamsType;
    const data = await this.service.getLabel(params);
    return this.sendOk(req, res, data);
  };
}
