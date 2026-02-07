import { BaseResponse } from "../common";

export interface ReceiptItem {
  name: string;
  qty: number;
  unit: string;
  price: string;
  discount: string;
  total: string;
}

export interface ReceiptData {
  storeName: string;
  address: string;
  phone: string;
  transactionDate: string;
  invoiceNumber: string;
  customerName: string;
  cashierName: string;
  items: ReceiptItem[];
  subTotal: string;
  globalDiscount: string;
  showTax: boolean;
  tax: string;
  totalAmount: string;
  payAmount: string;
  changeAmount: string;
}

export type ReceiptResponse = BaseResponse<ReceiptData>;

export interface SalesReceipt {
  branch: {
    id: number;
    code: string;
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  date: string;
  cashierName: string;
  totalTransaction: number;
  totalAmount: string; // serialized Decimal
  totalReturn: string; // serialized Decimal
  cashFlowIn: string;
  cashFlowOut: string;
  paymentType: {
    CASH: string;
    DEBIT: string;
    QRIS: string;
  };
  cashIncome: string; // serialized Decimal
  balance: string; // serialized Decimal
}

export type SalesReceiptResponse = BaseResponse<SalesReceipt>;
