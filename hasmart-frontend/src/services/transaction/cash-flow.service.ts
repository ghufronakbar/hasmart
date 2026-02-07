import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CashFlowListResponse,
  CashFlowResponse,
  CreateCashFlowDTO,
  UpdateCashFlowDTO,
} from "@/types/transaction/cash-flow";

export const cashFlowService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<CashFlowListResponse>(
      "/transaction/cash-flow",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<CashFlowResponse>(
      `/transaction/cash-flow/${id}`,
    );
    return response.data;
  },

  create: async (data: CreateCashFlowDTO) => {
    const response = await axiosInstance.post<CashFlowResponse>(
      "/transaction/cash-flow",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateCashFlowDTO) => {
    const response = await axiosInstance.put<CashFlowResponse>(
      `/transaction/cash-flow/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<CashFlowResponse>(
      `/transaction/cash-flow/${id}`,
    );
    return response.data;
  },
};
