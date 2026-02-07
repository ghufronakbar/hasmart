import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateSellDTO,
  SellListResponse,
  SellResponse,
  UpdateSellDTO,
  Sell,
} from "@/types/transaction/sell";

export const sellService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<SellListResponse>(
      "/transaction/sell",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<SellResponse>(
      `/transaction/sell/${id}`,
    );
    // Map backend response to frontend model
    if (response.data && response.data.data) {
      const d = response.data.data as Sell & {
        transactionSellItems?: import("@/types/transaction/sell").SellItem[];
      };
      if (d.transactionSellItems && (!d.items || d.items.length === 0)) {
        d.items = d.transactionSellItems.map((item) => ({
          ...item,
          discounts:
            (
              item as unknown as {
                transactionSellDiscounts?: { percentage: string }[];
              }
            ).transactionSellDiscounts ||
            item.discounts ||
            [],
        }));
      }
    }
    return response.data;
  },

  getByInvoice: async (invoiceNumber: string) => {
    const response = await axiosInstance.get<SellResponse>(
      `/transaction/sell/${invoiceNumber}/invoice`,
    );
    // Map backend response to frontend model
    if (response.data && response.data.data) {
      const d = response.data.data as Sell & {
        transactionSellItems?: import("@/types/transaction/sell").SellItem[];
      };
      if (d.transactionSellItems && (!d.items || d.items.length === 0)) {
        d.items = d.transactionSellItems.map((item) => ({
          ...item,
          discounts:
            (
              item as unknown as {
                transactionSellDiscounts?: { percentage: string }[];
              }
            ).transactionSellDiscounts ||
            item.discounts ||
            [],
        }));
      }
    }
    return response.data;
  },

  create: async (data: CreateSellDTO) => {
    const response = await axiosInstance.post<SellResponse>(
      "/transaction/sell",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateSellDTO) => {
    const response = await axiosInstance.put<SellResponse>(
      `/transaction/sell/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<SellResponse>(
      `/transaction/sell/${id}`,
    );
    return response.data;
  },
};
