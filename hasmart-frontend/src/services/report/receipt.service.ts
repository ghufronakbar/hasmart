import { axiosInstance } from "@/lib/axios";
import { ReceiptResponse, SalesReceiptResponse } from "@/types/report/receipt";

export const receiptService = {
  get: async (type: string, receiptId: number | string) => {
    const response = await axiosInstance.get<ReceiptResponse>(
      `/report/receipt/${type}/${receiptId}`,
    );
    return response.data;
  },
  getDailySales: async (params: { date: Date; branchId: number }) => {
    const response = await axiosInstance.get<SalesReceiptResponse>(
      "/report/receipt/sales",
      {
        params: {
          date: params.date.toISOString(),
          branchId: params.branchId,
        },
      },
    );
    return response.data;
  },
};
