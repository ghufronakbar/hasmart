import { BaseController } from "../../../base/base-controller";
import { MemberCategoryService } from "./member-category.service";
import { Request, Response } from "express";
import {
  MemberCategoryBodyType,
  MemberCategoryParamsType,
  MemberCategoryCodeParamsType,
} from "./member-category.validator";

export class MemberCategoryController extends BaseController {
  constructor(private service: MemberCategoryService) {
    super();
  }

  getAllMemberCategories = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const { rows, pagination } =
      await this.service.getAllMemberCategories(filter);
    return this.sendList(req, res, rows, pagination, filter);
  };

  getMemberCategoryById = async (req: Request, res: Response) => {
    const params = req.params as unknown as MemberCategoryParamsType;
    const data = await this.service.getMemberCategoryById(
      params.memberCategoryId,
    );
    return this.sendOk(req, res, data);
  };

  getMemberCategoryByCode = async (req: Request, res: Response) => {
    const params = req.params as unknown as MemberCategoryCodeParamsType;
    const data = await this.service.getMemberCategoryByCode(params.code);
    return this.sendOk(req, res, data);
  };

  createMemberCategory = async (req: Request, res: Response) => {
    const data = req.body as MemberCategoryBodyType;
    const result = await this.service.createMemberCategory(data);
    return this.sendOk(req, res, result);
  };

  updateMemberCategory = async (req: Request, res: Response) => {
    const params = req.params as unknown as MemberCategoryParamsType;
    const data = req.body as MemberCategoryBodyType;
    const result = await this.service.updateMemberCategory(
      params.memberCategoryId,
      data,
    );
    return this.sendOk(req, res, result);
  };

  deleteMemberCategory = async (req: Request, res: Response) => {
    const params = req.params as unknown as MemberCategoryParamsType;
    const result = await this.service.deleteMemberCategory(
      params.memberCategoryId,
    );
    return this.sendOk(req, res, result);
  };
}
