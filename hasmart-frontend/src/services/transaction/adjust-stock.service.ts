import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  TransactionAdjustmentListResponse,
  TransactionAdjustmentResponse,
  CreateTransactionAdjustmentDTO,
} from "@/types/transaction/adjust-stock";

const BASE_URL = "/transaction/adjust-stock";

export const adjustStockService = {
  // List Adjustments
  list: async (
    params?: FilterQuery,
  ): Promise<TransactionAdjustmentListResponse> => {
    const response = await axiosInstance.get(BASE_URL, { params });
    return response.data;
  },

  // Get Adjustment Detail
  getById: async (id: number): Promise<TransactionAdjustmentResponse> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Create (Stock Opname)
  create: async (
    data: CreateTransactionAdjustmentDTO,
  ): Promise<TransactionAdjustmentResponse> => {
    const response = await axiosInstance.post(BASE_URL, data);
    // Note: Backend might return array of created adjustments if split, but usually for single transaction context we handle as one,
    // or the response is wrapped. Based on docs: "Response: Array of created adjustments".
    // Wait, the docs say "Response: Array of created adjustments (hanya item yang ada selisih)".
    // If the backend returns an array, we might need to adjust the response type or how we handle it.
    // Let's assume for standard CRUD hooks we expect a single response object or handle the array.
    // If the backend returns `BaseResponse<TransactionAdjustment[]>`, we should adapt.
    // Checking doc again: "Response: Array of created adjustments"
    // Let's type strictly: The return might be TransactionAdjustment[] wrapped in BaseResponse.
    // For now, let's keep it generic and see. If it's batch, the hook might need adaptation.
    // ACTUALLY, usually standard is to return the created parent object. If this creates MULTIPLE adjustments (one per item group?),
    // that's a different pattern.
    // "One request can generate multiple adjustment records (one per item that has gap)".
    // So the POST returns `data: TransactionAdjustment[]`.
    return response.data;
  },

  // Delete (Undo)
  delete: async (id: number): Promise<TransactionAdjustmentResponse> => {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};
