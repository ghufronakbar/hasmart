import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateTransferDTO,
  TransferListResponse,
  TransferResponse,
  UpdateTransferDTO,
} from "@/types/transaction/transfer";

export const transferService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<TransferListResponse>(
      "/transaction/transfer",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<TransferResponse>(
      `/transaction/transfer/${id}`,
    );
    return response.data;
  },

  create: async (data: CreateTransferDTO) => {
    const response = await axiosInstance.post<TransferResponse>(
      "/transaction/transfer",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateTransferDTO) => {
    const response = await axiosInstance.put<TransferResponse>(
      `/transaction/transfer/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<TransferResponse>(
      `/transaction/transfer/${id}`,
    );
    return response.data;
  },
};
