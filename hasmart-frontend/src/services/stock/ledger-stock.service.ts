import { axiosInstance } from "@/lib/axios";
import {
  LedgerStockListResponse,
  LedgerStockQuery,
} from "@/types/stock/ledger-stock";

export const ledgerStockService = {
  list: async (params?: LedgerStockQuery) => {
    const response = await axiosInstance.get<LedgerStockListResponse>(
      "/stock/ledger-stock",
      { params },
    );
    return response.data;
  },
};
