import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateItemDTO,
  ItemListResponse,
  ItemResponse,
  UpdateItemDTO,
  ItemByCodeResponse,
} from "@/types/master/item";

export const itemService = {
  list: async (
    params?: FilterQuery & { branchId?: number; idNotIns?: string },
  ) => {
    const response = await axiosInstance.get<ItemListResponse>("/master/item", {
      params,
    });
    return response.data;
  },

  get: async (id: number | string, params?: { branchId?: number }) => {
    const response = await axiosInstance.get<ItemResponse>(
      `/master/item/${id}`,
      { params },
    );
    return response.data;
  },

  create: async (data: CreateItemDTO) => {
    const response = await axiosInstance.post<ItemResponse>(
      "/master/item",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateItemDTO) => {
    const response = await axiosInstance.put<ItemResponse>(
      `/master/item/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<ItemResponse>(
      `/master/item/${id}`,
    );
    return response.data;
  },

  getItemByCode: async (code: string) => {
    const response = await axiosInstance.get<ItemByCodeResponse>(
      `/master/item/code/${code}`,
    );
    return response.data;
  },

  bulkUpdateVariantPrice: async (data: {
    masterItemVariants: number[];
    sellPrice: number;
  }) => {
    const response = await axiosInstance.patch<boolean>(
      "/master/item/bulk-variant-price",
      data,
    );
    return response.data;
  },
};
