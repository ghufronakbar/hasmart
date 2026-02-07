import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  FrontStockItemResponse,
  FrontStockTransferListResponse,
  CreateFrontStockTransferDTO,
} from "@/types/stock/front-stock";

export const frontStockService = {
  // Get Item with Front Stock
  listItems: async (params?: FilterQuery & { branchId?: number }) => {
    const response = await axiosInstance.get<FrontStockItemResponse>(
      "/stock/front-stock/item",
      {
        params,
      },
    );
    return response.data;
  },

  // List Front Stock Transfers (History)
  listTransfers: async (params?: FilterQuery & { branchId?: number }) => {
    const response = await axiosInstance.get<FrontStockTransferListResponse>(
      "/stock/front-stock/transfer",
      { params },
    );
    return response.data;
  },

  // Create Front Stock Transfer
  createTransfer: async (data: CreateFrontStockTransferDTO) => {
    const response = await axiosInstance.post(
      "/stock/front-stock/transfer",
      data,
    );
    return response.data;
  },

  // Delete/Void Front Stock Transfer
  deleteTransfer: async (id: number) => {
    const response = await axiosInstance.delete(
      `/stock/front-stock/transfer/${id}`,
    );
    return response.data;
  },
};
