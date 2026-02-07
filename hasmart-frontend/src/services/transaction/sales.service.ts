import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateSalesDTO,
  SalesListResponse,
  SalesResponse,
  UpdateSalesDTO,
} from "@/types/transaction/sales";

export const salesService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<SalesListResponse>(
      "/transaction/sales",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<SalesResponse>(
      `/transaction/sales/${id}`,
    );
    return response.data;
  },

  getByInvoice: async (invoiceNumber: string) => {
    const response = await axiosInstance.get<SalesResponse>(
      `/transaction/sales/${invoiceNumber}/invoice`,
    );
    return response.data;
  },

  create: async (data: CreateSalesDTO) => {
    const response = await axiosInstance.post<SalesResponse>(
      "/transaction/sales",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateSalesDTO) => {
    const response = await axiosInstance.put<SalesResponse>(
      `/transaction/sales/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<SalesResponse>(
      `/transaction/sales/${id}`,
    );
    return response.data;
  },
};
