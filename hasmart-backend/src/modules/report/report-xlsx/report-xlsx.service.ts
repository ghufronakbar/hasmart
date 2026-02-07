import { BaseService } from "../../../base/base-service";
import ExcelJS from "exceljs";

import {
  PurchaseReportItem,
  PurchaseReturnReportItem,
  SalesReportItem,
  SalesReturnReportItem,
  SellReportItem,
  SellReturnReportItem,
  ItemReportItem,
  MemberReportItem,
  MemberPurchaseReportItem,
} from "../report/report.interface";

export class ReportXlsxService extends BaseService {
  constructor() {
    super();
  }

  async generatePurchaseReport(data: PurchaseReportItem[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Purchase Report");

    // Manually manage rows
    let currentRow = 1;

    // Report Title
    const titleRow = worksheet.getRow(currentRow++);
    titleRow.getCell(1).value = "Laporan Pembelian";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    currentRow++; // Gap

    data.forEach((item) => {
      // Transaction Header
      const headerRow = worksheet.getRow(currentRow++);
      headerRow.getCell(1).value = item.invoiceNumber;
      headerRow.font = { bold: true };

      const infoRow1 = worksheet.getRow(currentRow++);
      infoRow1.getCell(1).value = "Supplier";
      infoRow1.getCell(2).value = item.supplierName;
      infoRow1.getCell(4).value = "Tanggal";
      infoRow1.getCell(5).value = new Date(item.transactionDate);
      infoRow1.getCell(5).numFmt = "d/m/yyyy";

      currentRow++; // Gap

      // Items Table Header
      const tableHeaderRow = worksheet.getRow(currentRow++);
      tableHeaderRow.getCell(1).value = "Nama Barang";
      tableHeaderRow.getCell(2).value = "Varian";
      tableHeaderRow.getCell(3).value = "Qty";
      tableHeaderRow.getCell(4).value = "Harga";
      tableHeaderRow.getCell(5).value = "Diskon";
      tableHeaderRow.getCell(6).value = "Pajak";
      tableHeaderRow.getCell(7).value = "Subtotal";
      tableHeaderRow.font = { bold: true };

      // Items
      item.items.forEach((detail) => {
        const row = worksheet.getRow(currentRow++);
        row.getCell(1).value = detail.itemName;
        row.getCell(2).value = detail.variantName;
        row.getCell(3).value = detail.qty;
        row.getCell(4).value = detail.price;
        row.getCell(5).value = detail.discount;
        row.getCell(6).value = detail.tax;
        row.getCell(7).value = detail.total;
      });

      // Summary
      currentRow++; // Gap before summary

      const subTotalRow = worksheet.getRow(currentRow++);
      subTotalRow.getCell(6).value = "Subtotal";
      subTotalRow.getCell(7).value = item.subTotal;
      subTotalRow.getCell(7).numFmt = "#,##0.00";

      const discountRow = worksheet.getRow(currentRow++);
      discountRow.getCell(6).value = "Diskon";
      discountRow.getCell(7).value = item.discount;
      discountRow.getCell(7).numFmt = "#,##0.00";

      const taxRow = worksheet.getRow(currentRow++);
      taxRow.getCell(6).value = "Pajak";
      taxRow.getCell(7).value = item.tax;
      taxRow.getCell(7).numFmt = "#,##0.00";

      const totalRow = worksheet.getRow(currentRow++);
      totalRow.getCell(6).value = "Total";
      totalRow.getCell(6).font = { bold: true };
      totalRow.getCell(7).value = item.totalAmount;
      totalRow.getCell(7).font = { bold: true };
      totalRow.getCell(7).numFmt = "#,##0.00";

      currentRow += 2; // Gap between transactions
    });

    // Adjust column widths manually since we didn't use columns property
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 20;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  async generatePurchaseReturnReport(
    data: PurchaseReturnReportItem[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Purchase Return Report");

    // Manually manage rows
    let currentRow = 1;

    // Report Title
    const titleRow = worksheet.getRow(currentRow++);
    titleRow.getCell(1).value = "Laporan Retur Pembelian";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    currentRow++; // Gap

    data.forEach((item) => {
      // Transaction Header
      const headerRow = worksheet.getRow(currentRow++);
      headerRow.getCell(1).value = item.invoiceNumber;
      headerRow.font = { bold: true };

      const infoRow1 = worksheet.getRow(currentRow++);
      infoRow1.getCell(1).value = "Supplier";
      infoRow1.getCell(2).value = item.supplierName;
      infoRow1.getCell(4).value = "Tanggal";
      infoRow1.getCell(5).value = new Date(item.transactionDate);
      infoRow1.getCell(5).numFmt = "d/m/yyyy";

      currentRow++; // Gap

      // Items Table Header
      const tableHeaderRow = worksheet.getRow(currentRow++);
      tableHeaderRow.getCell(1).value = "Nama Barang";
      tableHeaderRow.getCell(2).value = "Varian";
      tableHeaderRow.getCell(3).value = "Qty";
      tableHeaderRow.getCell(4).value = "Harga";
      tableHeaderRow.getCell(5).value = "Diskon";
      tableHeaderRow.getCell(6).value = "Pajak";
      tableHeaderRow.getCell(7).value = "Subtotal";
      tableHeaderRow.font = { bold: true };

      // Items
      item.items.forEach((detail) => {
        const row = worksheet.getRow(currentRow++);
        row.getCell(1).value = detail.itemName;
        row.getCell(2).value = detail.variantName;
        row.getCell(3).value = detail.qty;
        row.getCell(4).value = detail.price;
        row.getCell(5).value = detail.discount;
        row.getCell(6).value = detail.tax;
        row.getCell(7).value = detail.total;
      });

      // Summary
      currentRow++; // Gap before summary

      const subTotalRow = worksheet.getRow(currentRow++);
      subTotalRow.getCell(6).value = "Subtotal";
      subTotalRow.getCell(7).value = item.subTotal;
      subTotalRow.getCell(7).numFmt = "#,##0.00";

      const discountRow = worksheet.getRow(currentRow++);
      discountRow.getCell(6).value = "Diskon";
      discountRow.getCell(7).value = item.discount;
      discountRow.getCell(7).numFmt = "#,##0.00";

      const taxRow = worksheet.getRow(currentRow++);
      taxRow.getCell(6).value = "Pajak";
      taxRow.getCell(7).value = item.tax;
      taxRow.getCell(7).numFmt = "#,##0.00";

      const totalRow = worksheet.getRow(currentRow++);
      totalRow.getCell(6).value = "Total";
      totalRow.getCell(6).font = { bold: true };
      totalRow.getCell(7).value = item.totalAmount;
      totalRow.getCell(7).font = { bold: true };
      totalRow.getCell(7).numFmt = "#,##0.00";

      currentRow += 2; // Gap between transactions
    });

    // Adjust column widths manually since we didn't use columns property
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 20;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  async generateSalesReport(data: SalesReportItem[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Manually manage rows
    let currentRow = 1;

    // Report Title
    const titleRow = worksheet.getRow(currentRow++);
    titleRow.getCell(1).value = "Laporan Penjualan";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    currentRow++; // Gap

    data.forEach((item) => {
      // Transaction Header
      const headerRow = worksheet.getRow(currentRow++);
      headerRow.getCell(1).value = item.invoiceNumber;
      headerRow.font = { bold: true };

      const infoRow1 = worksheet.getRow(currentRow++);
      infoRow1.getCell(1).value = "Member";
      infoRow1.getCell(2).value = item.memberName;
      infoRow1.getCell(4).value = "Tanggal";
      infoRow1.getCell(5).value = new Date(item.transactionDate);
      infoRow1.getCell(5).numFmt = "d/m/yyyy";

      currentRow++; // Gap

      // Items Table Header
      const tableHeaderRow = worksheet.getRow(currentRow++);
      tableHeaderRow.getCell(1).value = "Nama Barang";
      tableHeaderRow.getCell(2).value = "Varian";
      tableHeaderRow.getCell(3).value = "Qty";
      tableHeaderRow.getCell(4).value = "Harga";
      tableHeaderRow.getCell(5).value = "Diskon";
      tableHeaderRow.getCell(6).value = "Harga Beli";
      tableHeaderRow.getCell(7).value = "Laba Kotor";
      tableHeaderRow.getCell(8).value = "Laba Bersih";
      tableHeaderRow.font = { bold: true };

      // Items
      item.items.forEach((detail) => {
        const row = worksheet.getRow(currentRow++);
        row.getCell(1).value = detail.itemName;
        row.getCell(2).value = detail.variantName;
        row.getCell(3).value = detail.qty;
        row.getCell(4).value = detail.price;
        row.getCell(5).value = detail.discount;
        row.getCell(6).value = detail.buyPrice;
        row.getCell(7).value = detail.grossProfit;
        row.getCell(8).value = detail.netProfit;
      });

      // Summary
      currentRow++; // Gap before summary

      const subTotalRow = worksheet.getRow(currentRow++);
      subTotalRow.getCell(6).value = "Subtotal";
      subTotalRow.getCell(7).value = item.subTotal;
      subTotalRow.getCell(7).numFmt = "#,##0.00";

      const discountRow = worksheet.getRow(currentRow++);
      discountRow.getCell(6).value = "Diskon";
      discountRow.getCell(7).value = item.discount;
      discountRow.getCell(7).numFmt = "#,##0.00";

      const totalRow = worksheet.getRow(currentRow++);
      totalRow.getCell(6).value = "Total";
      totalRow.getCell(6).font = { bold: true };
      totalRow.getCell(7).value = item.totalAmount;
      totalRow.getCell(7).font = { bold: true };
      totalRow.getCell(7).numFmt = "#,##0.00";

      const totalGrossProfitRow = worksheet.getRow(currentRow++);
      totalGrossProfitRow.getCell(6).value = "Laba Kotor";
      totalGrossProfitRow.getCell(6).font = { bold: true };
      totalGrossProfitRow.getCell(7).value = item.totalGrossProfit;
      totalGrossProfitRow.getCell(7).font = { bold: true };
      totalGrossProfitRow.getCell(7).numFmt = "#,##0.00";

      const totalNetProfitRow = worksheet.getRow(currentRow++);
      totalNetProfitRow.getCell(6).value = "Laba Bersih";
      totalNetProfitRow.getCell(6).font = { bold: true };
      totalNetProfitRow.getCell(7).value = item.totalNetProfit;
      totalNetProfitRow.getCell(7).font = { bold: true };
      totalNetProfitRow.getCell(7).numFmt = "#,##0.00";

      currentRow += 2; // Gap between transactions
    });

    // Adjust column widths manually since we didn't use columns property
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 20;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  async generateSalesReturnReport(
    data: SalesReturnReportItem[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Return Report");

    // Manually manage rows
    let currentRow = 1;

    // Report Title
    const titleRow = worksheet.getRow(currentRow++);
    titleRow.getCell(1).value = "Laporan Retur Penjualan";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    currentRow++; // Gap

    data.forEach((item) => {
      // Transaction Header
      const headerRow = worksheet.getRow(currentRow++);
      headerRow.getCell(1).value = item.returnNumber;
      headerRow.font = { bold: true };

      const infoRow1 = worksheet.getRow(currentRow++);
      infoRow1.getCell(1).value = "Ref Invoice";
      infoRow1.getCell(2).value = item.invoiceNumberRef;
      infoRow1.getCell(4).value = "Tanggal";
      infoRow1.getCell(5).value = new Date(item.transactionDate);
      infoRow1.getCell(5).numFmt = "d/m/yyyy";

      currentRow++; // Gap

      // Items Table Header
      const tableHeaderRow = worksheet.getRow(currentRow++);
      tableHeaderRow.getCell(1).value = "Nama Barang";
      tableHeaderRow.getCell(2).value = "Varian";
      tableHeaderRow.getCell(3).value = "Qty";
      tableHeaderRow.getCell(4).value = "Harga";
      tableHeaderRow.getCell(5).value = "Diskon";
      tableHeaderRow.getCell(6).value = "Total";
      tableHeaderRow.font = { bold: true };

      // Items
      item.items.forEach((detail) => {
        const row = worksheet.getRow(currentRow++);
        row.getCell(1).value = detail.itemName;
        row.getCell(2).value = detail.variantName;
        row.getCell(3).value = detail.qty;
        row.getCell(4).value = detail.price;
        row.getCell(5).value = detail.discount;
        row.getCell(6).value = detail.total;
      });

      // Summary
      currentRow++; // Gap before summary

      const subTotalRow = worksheet.getRow(currentRow++);
      subTotalRow.getCell(5).value = "Subtotal";
      subTotalRow.getCell(6).value = item.subTotal;
      subTotalRow.getCell(6).numFmt = "#,##0.00";

      const discountRow = worksheet.getRow(currentRow++);
      discountRow.getCell(5).value = "Diskon";
      discountRow.getCell(6).value = item.discount;
      discountRow.getCell(6).numFmt = "#,##0.00";

      const totalRow = worksheet.getRow(currentRow++);
      totalRow.getCell(5).value = "Total";
      totalRow.getCell(5).font = { bold: true };
      totalRow.getCell(6).value = item.totalAmount;
      totalRow.getCell(6).font = { bold: true };
      totalRow.getCell(6).numFmt = "#,##0.00";

      currentRow += 2; // Gap between transactions
    });

    // Adjust column widths manually since we didn't use columns property
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 20;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  async generateSellReport(data: SellReportItem[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sell Report");

    // Manually manage rows
    let currentRow = 1;

    // Report Title
    const titleRow = worksheet.getRow(currentRow++);
    titleRow.getCell(1).value = "Laporan Penjualan (B2B)";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    currentRow++; // Gap

    data.forEach((item) => {
      // Transaction Header
      const headerRow = worksheet.getRow(currentRow++);
      headerRow.getCell(1).value = item.invoiceNumber;
      headerRow.font = { bold: true };

      const infoRow1 = worksheet.getRow(currentRow++);
      infoRow1.getCell(1).value = "Customer (Member)";
      infoRow1.getCell(2).value = item.customerName;
      infoRow1.getCell(4).value = "Tanggal";
      infoRow1.getCell(5).value = new Date(item.transactionDate);
      infoRow1.getCell(5).numFmt = "d/m/yyyy";

      currentRow++; // Gap

      const infoRow2 = worksheet.getRow(currentRow++);
      infoRow2.getCell(4).value = "Jatuh Tempo";
      infoRow2.getCell(5).value = new Date(item.dueDate);
      infoRow2.getCell(5).numFmt = "d/m/yyyy";

      currentRow++; // Gap

      // Items Table Header
      const tableHeaderRow = worksheet.getRow(currentRow++);
      tableHeaderRow.getCell(1).value = "Nama Barang";
      tableHeaderRow.getCell(2).value = "Varian";
      tableHeaderRow.getCell(3).value = "Qty";
      tableHeaderRow.getCell(4).value = "Harga";
      tableHeaderRow.getCell(5).value = "Diskon";
      tableHeaderRow.getCell(6).value = "Pajak";
      tableHeaderRow.getCell(7).value = "Harga Beli";
      tableHeaderRow.getCell(8).value = "Laba Kotor";
      tableHeaderRow.getCell(9).value = "Laba Bersih";
      tableHeaderRow.font = { bold: true };

      // Items
      item.items.forEach((detail) => {
        const row = worksheet.getRow(currentRow++);
        row.getCell(1).value = detail.itemName;
        row.getCell(2).value = detail.variantName;
        row.getCell(3).value = detail.qty;
        row.getCell(4).value = detail.price;
        row.getCell(5).value = detail.discount;
        row.getCell(6).value = detail.tax;
        row.getCell(7).value = detail.buyPrice;
        row.getCell(8).value = detail.grossProfit;
        row.getCell(9).value = detail.netProfit;
      });

      // Summary
      currentRow++; // Gap before summary

      const subTotalRow = worksheet.getRow(currentRow++);
      subTotalRow.getCell(7).value = "Subtotal";
      subTotalRow.getCell(8).value = item.subTotal;
      subTotalRow.getCell(8).numFmt = "#,##0.00";

      const discountRow = worksheet.getRow(currentRow++);
      discountRow.getCell(7).value = "Diskon";
      discountRow.getCell(8).value = item.discount;
      discountRow.getCell(8).numFmt = "#,##0.00";

      const taxRow = worksheet.getRow(currentRow++);
      taxRow.getCell(7).value = "Pajak";
      taxRow.getCell(8).value = item.tax;
      taxRow.getCell(8).numFmt = "#,##0.00";

      const totalRow = worksheet.getRow(currentRow++);
      totalRow.getCell(7).value = "Total";
      totalRow.getCell(7).font = { bold: true };
      totalRow.getCell(8).value = item.totalAmount;
      totalRow.getCell(8).font = { bold: true };
      totalRow.getCell(8).numFmt = "#,##0.00";

      const totalGrossProfitRow = worksheet.getRow(currentRow++);
      totalGrossProfitRow.getCell(7).value = "Laba Kotor";
      totalGrossProfitRow.getCell(7).font = { bold: true };
      totalGrossProfitRow.getCell(8).value = item.totalGrossProfit;
      totalGrossProfitRow.getCell(8).font = { bold: true };
      totalGrossProfitRow.getCell(8).numFmt = "#,##0.00";

      const totalNetProfitRow = worksheet.getRow(currentRow++);
      totalNetProfitRow.getCell(7).value = "Laba Bersih";
      totalNetProfitRow.getCell(7).font = { bold: true };
      totalNetProfitRow.getCell(8).value = item.totalNetProfit;
      totalNetProfitRow.getCell(8).font = { bold: true };
      totalNetProfitRow.getCell(8).numFmt = "#,##0.00";

      currentRow += 2; // Gap between transactions
    });

    // Adjust column widths manually since we didn't use columns property
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 20;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  async generateSellReturnReport(
    data: SellReturnReportItem[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sell Return Report");

    // Manually manage rows
    let currentRow = 1;

    // Report Title
    const titleRow = worksheet.getRow(currentRow++);
    titleRow.getCell(1).value = "Laporan Retur Penjualan (B2B)";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    currentRow++; // Gap

    data.forEach((item) => {
      // Transaction Header
      const headerRow = worksheet.getRow(currentRow++);
      headerRow.getCell(1).value = item.invoiceNumber; // Return Number
      headerRow.font = { bold: true };

      const infoRow1 = worksheet.getRow(currentRow++);
      infoRow1.getCell(1).value = "Customer";
      infoRow1.getCell(2).value = item.customerName;
      infoRow1.getCell(4).value = "Tanggal";
      infoRow1.getCell(5).value = new Date(item.transactionDate);
      infoRow1.getCell(5).numFmt = "d/m/yyyy";

      currentRow++; // Gap

      // Items Table Header
      const tableHeaderRow = worksheet.getRow(currentRow++);
      tableHeaderRow.getCell(1).value = "Nama Barang";
      tableHeaderRow.getCell(2).value = "Varian";
      tableHeaderRow.getCell(3).value = "Qty";
      tableHeaderRow.getCell(4).value = "Harga";
      tableHeaderRow.getCell(5).value = "Diskon";
      tableHeaderRow.getCell(6).value = "Pajak";
      tableHeaderRow.getCell(7).value = "Total";
      tableHeaderRow.font = { bold: true };

      // Items
      item.items.forEach((detail) => {
        const row = worksheet.getRow(currentRow++);
        row.getCell(1).value = detail.itemName;
        row.getCell(2).value = detail.variantName;
        row.getCell(3).value = detail.qty;
        row.getCell(4).value = detail.price;
        row.getCell(5).value = detail.discount;
        row.getCell(6).value = detail.tax;
        row.getCell(7).value = detail.total;
      });

      // Summary
      currentRow++; // Gap before summary

      const subTotalRow = worksheet.getRow(currentRow++);
      subTotalRow.getCell(6).value = "Subtotal";
      subTotalRow.getCell(7).value = item.subTotal;
      subTotalRow.getCell(7).numFmt = "#,##0.00";

      const discountRow = worksheet.getRow(currentRow++);
      discountRow.getCell(6).value = "Diskon";
      discountRow.getCell(7).value = item.discount;
      discountRow.getCell(7).numFmt = "#,##0.00";

      const taxRow = worksheet.getRow(currentRow++);
      taxRow.getCell(6).value = "Pajak";
      taxRow.getCell(7).value = item.tax;
      taxRow.getCell(7).numFmt = "#,##0.00";

      const totalRow = worksheet.getRow(currentRow++);
      totalRow.getCell(6).value = "Total";
      totalRow.getCell(6).font = { bold: true };
      totalRow.getCell(7).value = item.totalAmount;
      totalRow.getCell(7).font = { bold: true };
      totalRow.getCell(7).numFmt = "#,##0.00";

      currentRow += 2; // Gap between transactions
    });

    // Adjust column widths manually since we didn't use columns property
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 20;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  async generateItemReport(data: ItemReportItem[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Master Item Report");

    // Manually manage rows
    let currentRow = 1;

    // Report Title
    const titleRow = worksheet.getRow(currentRow++);
    titleRow.getCell(1).value = "Laporan Master Barang";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    currentRow++; // Gap

    // Items Table Header
    const tableHeaderRow = worksheet.getRow(currentRow++);
    tableHeaderRow.getCell(1).value = "Kode";
    tableHeaderRow.getCell(2).value = "Nama";
    tableHeaderRow.getCell(3).value = "Stok";
    tableHeaderRow.getCell(4).value = "Kategori";
    tableHeaderRow.getCell(5).value = "Supplier";
    tableHeaderRow.getCell(6).value = "Unit";
    tableHeaderRow.getCell(7).value = "Conv";
    tableHeaderRow.getCell(8).value = "Harga Beli";
    tableHeaderRow.getCell(9).value = "Profit %";
    tableHeaderRow.getCell(10).value = "Profit";
    tableHeaderRow.getCell(11).value = "H. Jual";
    tableHeaderRow.font = { bold: true };

    // Items
    data.forEach((item) => {
      const row = worksheet.getRow(currentRow++);

      // Only show item details for the first variant
      if (item.isFirstVariant) {
        row.getCell(1).value = item.code;
        row.getCell(2).value = item.name;
        row.getCell(3).value = item.stock;
        row.getCell(4).value = item.category;
        row.getCell(5).value = item.supplier;
      } else {
        row.getCell(1).value = "";
        row.getCell(2).value = "";
        row.getCell(3).value = "";
        row.getCell(4).value = "";
        row.getCell(5).value = "";
      }

      row.getCell(6).value = item.variantUnit;
      row.getCell(7).value = item.variantAmount;
      row.getCell(8).value = item.buyPrice;
      row.getCell(9).value = item.profitPercentage;
      row.getCell(10).value = item.profitAmount;
      row.getCell(11).value = item.sellPrice;
    });

    // Adjust column widths manually
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 8;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 10;
    worksheet.getColumn(8).width = 15;
    worksheet.getColumn(9).width = 15;
    worksheet.getColumn(10).width = 15;
    worksheet.getColumn(11).width = 20;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
  async generateMemberReport(data: MemberReportItem[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Member Report");

    // Manually manage rows
    let currentRow = 1;

    // Report Title
    const titleRow = worksheet.getRow(currentRow++);
    titleRow.getCell(1).value = "Laporan Member";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    currentRow++; // Gap

    data.forEach((category) => {
      // Category Header
      const categoryRow = worksheet.getRow(currentRow++);
      categoryRow.getCell(1).value =
        `Kategori: ${category.categoryName} (${category.categoryCode})`;
      categoryRow.getCell(1).font = { bold: true, size: 12 };

      // Table Header
      const tableHeaderRow = worksheet.getRow(currentRow++);
      tableHeaderRow.getCell(1).value = "Kode";
      tableHeaderRow.getCell(2).value = "Nama";
      tableHeaderRow.getCell(3).value = "No. HP";
      tableHeaderRow.getCell(4).value = "Email";
      tableHeaderRow.getCell(5).value = "Alamat";
      tableHeaderRow.getCell(6).value = "Tgl Daftar";
      tableHeaderRow.font = { bold: true };

      // Members
      category.members.forEach((member) => {
        const row = worksheet.getRow(currentRow++);
        row.getCell(1).value = member.code;
        row.getCell(2).value = member.name;
        row.getCell(3).value = member.phone;
        row.getCell(4).value = member.email;
        row.getCell(5).value = member.address;
        row.getCell(6).value = new Date(member.createdAt);
        row.getCell(6).numFmt = "d/m/yyyy";
      });

      currentRow++; // Gap between categories
    });

    // Adjust column widths
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 25;
    worksheet.getColumn(5).width = 40;
    worksheet.getColumn(6).width = 15;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
  async generateMemberPurchaseReport(
    data: MemberPurchaseReportItem[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Member Purchase Report");

    // Manually manage rows
    let currentRow = 1;

    // Report Title
    const titleRow = worksheet.getRow(currentRow++);
    titleRow.getCell(1).value = "Laporan Pembelian Member";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    currentRow++; // Gap

    // Table Header
    const tableHeaderRow = worksheet.getRow(currentRow++);
    tableHeaderRow.getCell(1).value = "Kode";
    tableHeaderRow.getCell(2).value = "Nama";
    tableHeaderRow.getCell(3).value = "Kategori";
    tableHeaderRow.getCell(4).value = "No. HP";
    tableHeaderRow.getCell(5).value = "Email";
    tableHeaderRow.getCell(6).value = "Frekuensi";
    tableHeaderRow.getCell(7).value = "Total";
    tableHeaderRow.font = { bold: true };

    // Members
    data.forEach((item) => {
      const row = worksheet.getRow(currentRow++);
      row.getCell(1).value = item.code;
      row.getCell(2).value = item.name;
      row.getCell(3).value = item.category;
      row.getCell(4).value = item.phone;
      row.getCell(5).value = item.email;
      row.getCell(6).value = item.totalPurchaseFrequency;
      row.getCell(7).value = item.totalPurchaseAmount;
      row.getCell(7).numFmt = "#,##0.00";
    });

    // Adjust column widths
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 25;
    worksheet.getColumn(6).width = 10;
    worksheet.getColumn(7).width = 20;

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
}
