import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  FinancialSummaryResponse,
  SalesTrendResponse,
  TopProductsResponse,
  StockAlertsResponse,
} from "@/types/overview/overview";

const BASE_URL = "/overview";

export const overviewService = {
  // Financial Summary
  getFinancialSummary: async (
    params?: FilterQuery,
  ): Promise<FinancialSummaryResponse> => {
    const response = await axiosInstance.get(`${BASE_URL}/financial-summary`, {
      params,
    });
    return response.data;
  },

  // Sales Trend
  getSalesTrend: async (params?: FilterQuery): Promise<SalesTrendResponse> => {
    const response = await axiosInstance.get(`${BASE_URL}/sales-trend`, {
      params,
    });
    return response.data;
  },

  // Top Products
  getTopProducts: async (
    params?: FilterQuery,
  ): Promise<TopProductsResponse> => {
    const response = await axiosInstance.get(`${BASE_URL}/top-products`, {
      params,
    });
    return response.data;
  },

  // Stock Alerts
  getStockAlerts: async (
    params?: FilterQuery,
  ): Promise<StockAlertsResponse> => {
    const response = await axiosInstance.get(`${BASE_URL}/stock-alerts`, {
      params,
    });
    return response.data;
  },
};
