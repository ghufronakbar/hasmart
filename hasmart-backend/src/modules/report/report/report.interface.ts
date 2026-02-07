export interface PurchaseReportItemDetail {
  itemName: string;
  variantName: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface PurchaseReportItem {
  id: number;
  transactionDate: Date;
  invoiceNumber: string;
  supplierName: string;
  subTotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status?: string;
  items: PurchaseReportItemDetail[];
}

export interface ReportResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface PurchaseReturnReportItemDetail {
  itemName: string;
  variantName: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface PurchaseReturnReportItem {
  id: number;
  transactionDate: Date;
  invoiceNumber: string;
  supplierName: string;
  subTotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  items: PurchaseReturnReportItemDetail[];
}

export interface SalesReportItemDetail {
  itemName: string;
  variantName: string;
  qty: number;
  price: number;
  discount: number;
  netProfit: number;
  grossProfit: number;
  buyPrice: number;
  total: number;
}

export interface SalesReportItem {
  id: number;
  transactionDate: Date;
  invoiceNumber: string;
  memberName: string;
  subTotal: number;
  discount: number;
  totalNetProfit: number;
  totalGrossProfit: number;
  totalAmount: number;
  items: SalesReportItemDetail[];
}

export interface SalesReturnReportItemDetail {
  itemName: string;
  variantName: string;
  qty: number;
  price: number;
  discount: number;
  total: number;
}

export interface SalesReturnReportItem {
  id: number;
  transactionDate: Date;
  returnNumber: string; // Sales Return uses returnNumber
  invoiceNumberRef: string; // Reference to original Sales Invoice
  subTotal: number;
  discount: number;
  totalAmount: number;
  items: SalesReturnReportItemDetail[];
}

export interface SellReportItemDetail {
  itemName: string;
  variantName: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  netProfit: number;
  grossProfit: number;
  buyPrice: number;
  total: number;
}

export interface ItemReportItem {
  code: string;
  name: string;
  stock: number;
  category: string;
  supplier: string;
  variantUnit: string;
  variantAmount: number;
  buyPrice: number;
  profitPercentage: number;
  profitAmount: number;
  sellPrice: number;
  isFirstVariant: boolean; // Helper for formatting (row merging visual effect)
}

export interface SellReportItem {
  id: number;
  transactionDate: Date;
  invoiceNumber: string;
  customerName: string;
  subTotal: number;
  discount: number;
  tax: number;
  totalNetProfit: number;
  totalGrossProfit: number;
  totalAmount: number;
  dueDate: Date;
  items: SellReportItemDetail[];
}

export interface SellReturnReportItemDetail {
  itemName: string;
  variantName: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface SellReturnReportItem {
  id: number;
  transactionDate: Date;
  invoiceNumber: string; // Return Number
  customerName: string;
  subTotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  items: SellReturnReportItemDetail[];
}

export interface MemberReportItemDetail {
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: Date;
}

export interface MemberReportItem {
  categoryName: string;
  categoryCode: string;
  members: MemberReportItemDetail[];
}

export interface MemberPurchaseReportItem {
  code: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  totalPurchaseFrequency: number;
  totalPurchaseAmount: number;
}
