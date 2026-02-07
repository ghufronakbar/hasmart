import { BaseResponse } from "../common";

export interface ItemCategory {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateItemCategoryDTO {
  code: string;
  name: string;
}

export type UpdateItemCategoryDTO = Partial<CreateItemCategoryDTO>;

export type ItemCategoryResponse = BaseResponse<ItemCategory>;
export type ItemCategoryListResponse = BaseResponse<ItemCategory[]>;
