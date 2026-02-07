import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateSalesReturnDTO,
  SalesReturnListResponse,
  SalesReturnResponse,
  UpdateSalesReturnDTO,
} from "@/types/transaction/sales-return";

export const salesReturnService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<SalesReturnListResponse>(
      "/transaction/sales-return",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<SalesReturnResponse>(
      `/transaction/sales-return/${id}`,
    );
    return response.data;
  },

  create: async (data: CreateSalesReturnDTO) => {
    const response = await axiosInstance.post<SalesReturnResponse>(
      "/transaction/sales-return",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateSalesReturnDTO) => {
    const response = await axiosInstance.put<SalesReturnResponse>(
      `/transaction/sales-return/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<SalesReturnResponse>(
      `/transaction/sales-return/${id}`,
    );
    return response.data;
  },
};
