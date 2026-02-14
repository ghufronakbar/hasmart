import { BaseResponse } from "@/types/common";

// Financial Summary
export interface FinancialSummary {
  grossSales: number;
  totalReturns: number;
  netSales: number;
  netPurchase: number;
  transactionCount: number;
  grossProfit: number;
  netProfit: number;
}

export type FinancialSummaryResponse = BaseResponse<FinancialSummary>;

// Sales Trend
export interface SalesTrendItem {
  date: string;
  value: number;
}

export type SalesTrendResponse = BaseResponse<SalesTrendItem[]>;

// Top Products
export interface TopProductItem {
  name: string;
  soldQty: number;
  revenue: number;
}

export type TopProductsResponse = BaseResponse<TopProductItem[]>;

// Stock Alerts
export interface StockAlertItem {
  name: string;
  code: string;
  currentStock: number;
  unit: string;
}

export type StockAlertsResponse = BaseResponse<StockAlertItem[]>;
