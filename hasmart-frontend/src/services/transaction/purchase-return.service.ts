import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreatePurchaseReturnDTO,
  PurchaseReturnListResponse,
  PurchaseReturnResponse,
  UpdatePurchaseReturnDTO,
  PurchaseReturn,
} from "@/types/transaction/purchase-return";

export const purchaseReturnService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<PurchaseReturnListResponse>(
      "/transaction/purchase-return",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<PurchaseReturnResponse>(
      `/transaction/purchase-return/${id}`,
    );
    // Map backend response to frontend model
    if (response.data && response.data.data) {
      const d = response.data.data as PurchaseReturn & {
        transactionPurchaseReturnItems?: import("@/types/transaction/purchase-return").PurchaseReturnItem[];
      };
      if (
        d.transactionPurchaseReturnItems &&
        (!d.items || d.items.length === 0)
      ) {
        // Map items and their nested discounts
        d.items = d.transactionPurchaseReturnItems.map((item) => ({
          ...item,
          discounts:
            (
              item as unknown as {
                transactionPurchaseReturnDiscounts?: { percentage: string }[];
              }
            ).transactionPurchaseReturnDiscounts ||
            item.discounts ||
            [],
        }));
      }
    }
    return response.data;
  },

  create: async (data: CreatePurchaseReturnDTO) => {
    const response = await axiosInstance.post<PurchaseReturnResponse>(
      "/transaction/purchase-return",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdatePurchaseReturnDTO) => {
    const response = await axiosInstance.put<PurchaseReturnResponse>(
      `/transaction/purchase-return/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<PurchaseReturnResponse>(
      `/transaction/purchase-return/${id}`,
    );
    return response.data;
  },
};
