import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateItemCategoryDTO,
  ItemCategoryListResponse,
  ItemCategoryResponse,
  UpdateItemCategoryDTO,
} from "@/types/master/item-category";

export const itemCategoryService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<ItemCategoryListResponse>(
      "/master/item-category",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<ItemCategoryResponse>(
      `/master/item-category/${id}`,
    );
    return response.data;
  },

  create: async (data: CreateItemCategoryDTO) => {
    const response = await axiosInstance.post<ItemCategoryResponse>(
      "/master/item-category",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateItemCategoryDTO) => {
    const response = await axiosInstance.put<ItemCategoryResponse>(
      `/master/item-category/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<ItemCategoryResponse>(
      `/master/item-category/${id}`,
    );
    return response.data;
  },
};
