import { BaseController } from "../../../base/base-controller";
import { ItemCategoryService } from "./item-category.service";
import { Request, Response } from "express";
import {
  ItemCategoryBodyType,
  ItemCategoryParamsType,
} from "./item-category.validator";

export class ItemCategoryController extends BaseController {
  constructor(private service: ItemCategoryService) {
    super();
  }

  getAllItemCategories = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const { rows, pagination } =
      await this.service.getAllItemCategories(filter);
    return this.sendList(req, res, rows, pagination, filter);
  };

  getItemCategoryById = async (req: Request, res: Response) => {
    const params = req.params as unknown as ItemCategoryParamsType;
    const data = await this.service.getItemCategoryById(params.itemCategoryId);
    return this.sendOk(req, res, data);
  };

  createItemCategory = async (req: Request, res: Response) => {
    const data = req.body as ItemCategoryBodyType;
    const result = await this.service.createItemCategory(data);
    return this.sendOk(req, res, result);
  };

  updateItemCategory = async (req: Request, res: Response) => {
    const params = req.params as unknown as ItemCategoryParamsType;
    const data = req.body as ItemCategoryBodyType;
    const result = await this.service.updateItemCategory(
      params.itemCategoryId,
      data,
    );
    return this.sendOk(req, res, result);
  };

  deleteItemCategory = async (req: Request, res: Response) => {
    const params = req.params as unknown as ItemCategoryParamsType;
    const result = await this.service.deleteItemCategory(params.itemCategoryId);
    return this.sendOk(req, res, result);
  };
}
