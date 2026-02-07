import { Branch, SalesPaymentType } from ".prisma/client";

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
  transactionDate: Date;
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

// SALES
export type SalesReceipt = {
  branch: Branch;
  date: Date;
  cashierName: string; // user.name
  totalTransaction: number; // berapa banyak transaksi
  totalAmount: string; // uang masuk
  totalReturn: string; // uang keluar
  cashFlowIn: string;
  cashFlowOut: string;
  paymentType: {
    [key in SalesPaymentType]: string;
  };
  cashIncome: string; // uang yang diterima (hanya untuk cash)
  balance: string; // cashIncome - totalReturn
};
