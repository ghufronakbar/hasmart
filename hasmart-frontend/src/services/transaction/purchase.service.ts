import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreatePurchaseDTO,
  PurchaseListResponse,
  PurchaseResponse,
  UpdatePurchaseDTO,
  Purchase,
} from "@/types/transaction/purchase";

export const purchaseService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<PurchaseListResponse>(
      "/transaction/purchase",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<PurchaseResponse>( // Changed type to PurchaseResponse
      `/transaction/purchase/${id}`,
    );
    // Map backend response to frontend model
    if (response.data && response.data.data) {
      // Safe cast to access potential different property name
      const d = response.data.data as Purchase & {
        transactionPurchaseItems?: import("@/types/transaction/purchase").PurchaseItem[];
      }; // Modified line
      if (d.transactionPurchaseItems && (!d.items || d.items.length === 0)) {
        // Modified condition
        // Map items and their nested discounts
        d.items = d.transactionPurchaseItems.map((item) => ({
          ...item,
          discounts:
            (
              item as unknown as {
                transactionPurchaseDiscounts?: { percentage: string }[];
              }
            ).transactionPurchaseDiscounts ||
            item.discounts ||
            [],
        }));
      }
    }
    return response.data;
  },

  getByInvoice: async (invoiceNumber: string) => {
    const response = await axiosInstance.get<PurchaseResponse>(
      `/transaction/purchase/${invoiceNumber}/invoice`,
    );
    // Map backend response to frontend model
    if (response.data && response.data.data) {
      // Safe cast to access potential different property name
      const d = response.data.data as Purchase & {
        transactionPurchaseItems?: import("@/types/transaction/purchase").PurchaseItem[];
      };
      if (d.transactionPurchaseItems && (!d.items || d.items.length === 0)) {
        // Map items and their nested discounts
        d.items = d.transactionPurchaseItems.map((item) => ({
          ...item,
          discounts:
            (
              item as unknown as {
                transactionPurchaseDiscounts?: { percentage: string }[];
              }
            ).transactionPurchaseDiscounts ||
            item.discounts ||
            [],
        }));
      }
    }
    return response.data;
  },

  create: async (data: CreatePurchaseDTO) => {
    const response = await axiosInstance.post<PurchaseResponse>(
      "/transaction/purchase",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdatePurchaseDTO) => {
    const response = await axiosInstance.put<PurchaseResponse>(
      `/transaction/purchase/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<PurchaseResponse>(
      `/transaction/purchase/${id}`,
    );
    return response.data;
  },
};
