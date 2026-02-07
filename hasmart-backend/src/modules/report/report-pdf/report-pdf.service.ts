// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require("pdfmake/js/Printer").default;
import { BaseService } from "../../../base/base-service";
import { TDocumentDefinitions } from "pdfmake/interfaces";

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
import { ReportHelper } from "../report/report-helper";

export class ReportPdfService extends BaseService {
  constructor() {
    super();
  }

  async generatePurchaseReport(data: PurchaseReportItem[]): Promise<Buffer> {
    const fonts = ReportHelper.getFonts();
    const printer = new PdfPrinter(fonts);

    const content: any[] = [{ text: "Laporan Pembelian", style: "header" }];

    data.forEach((purchase) => {
      content.push({
        text: purchase.invoiceNumber,
        style: "subHeader",
        margin: [0, 15, 0, 5],
      });

      // Purchase Header Info
      content.push({
        columns: [
          { text: `Supplier: ${purchase.supplierName}` },
          {
            text: `Tanggal: ${ReportHelper.formatDate(purchase.transactionDate)}`,
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 2],
      });

      content.push({
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            stack: [
              {
                columns: [
                  { text: "Subtotal:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(purchase.subTotal),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Diskon:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(purchase.discount),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Pajak:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(purchase.tax),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Total:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(purchase.totalAmount),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      });

      // Items Table
      content.push({
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nama Barang", style: "tableHeader" },
              { text: "Varian", style: "tableHeader" },
              { text: "Qty", style: "tableHeader", alignment: "right" },
              { text: "Harga", style: "tableHeader", alignment: "right" },
              { text: "Diskon", style: "tableHeader", alignment: "right" },
              { text: "Pajak", style: "tableHeader", alignment: "right" },
              { text: "Subtotal", style: "tableHeader", alignment: "right" },
            ],
            ...purchase.items.map((item) => [
              item.itemName,
              item.variantName,
              { text: item.qty.toString(), alignment: "right" as const },
              {
                text: ReportHelper.formatCurrency(item.price),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.discount),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.tax),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.total),
                alignment: "right" as const,
              },
            ]),
          ],
        },
      });
    });

    const docDefinition: TDocumentDefinitions = {
      content: content,
      styles: ReportHelper.getStyles(),
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      pdfDoc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    });
  }

  async generatePurchaseReturnReport(
    data: PurchaseReturnReportItem[],
  ): Promise<Buffer> {
    const fonts = ReportHelper.getFonts();
    const printer = new PdfPrinter(fonts);

    const content: any[] = [
      { text: "Laporan Retur Pembelian", style: "header" },
    ];

    data.forEach((purchase) => {
      content.push({
        text: purchase.invoiceNumber,
        style: "subHeader",
        margin: [0, 15, 0, 5],
      });

      // Purchase Header Info
      content.push({
        columns: [
          { text: `Supplier: ${purchase.supplierName}` },
          {
            text: `Tanggal: ${ReportHelper.formatDate(purchase.transactionDate)}`,
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 2],
      });

      content.push({
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            stack: [
              {
                columns: [
                  { text: "Subtotal:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(purchase.subTotal),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Diskon:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(purchase.discount),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Pajak:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(purchase.tax),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Total:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(purchase.totalAmount),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      });

      // Items Table
      content.push({
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nama Barang", style: "tableHeader" },
              { text: "Varian", style: "tableHeader" },
              { text: "Qty", style: "tableHeader", alignment: "right" },
              { text: "Harga", style: "tableHeader", alignment: "right" },
              { text: "Diskon", style: "tableHeader", alignment: "right" },
              { text: "Pajak", style: "tableHeader", alignment: "right" },
              { text: "Subtotal", style: "tableHeader", alignment: "right" },
            ],
            ...purchase.items.map((item) => [
              item.itemName,
              item.variantName,
              { text: item.qty.toString(), alignment: "right" as const },
              {
                text: ReportHelper.formatCurrency(item.price),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.discount),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.tax),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.total),
                alignment: "right" as const,
              },
            ]),
          ],
        },
      });
    });

    const docDefinition: TDocumentDefinitions = {
      content: content,
      styles: ReportHelper.getStyles(),
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      pdfDoc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    });
  }

  async generateSalesReport(data: SalesReportItem[]): Promise<Buffer> {
    const fonts = ReportHelper.getFonts();
    const printer = new PdfPrinter(fonts);

    const content: any[] = [{ text: "Laporan Penjualan", style: "header" }];

    data.forEach((sales) => {
      content.push({
        text: sales.invoiceNumber,
        style: "subHeader",
        margin: [0, 15, 0, 5],
      });

      // Sales Header Info
      content.push({
        columns: [
          {
            text: `Member: ${sales.memberName}`,
            alignment: "left",
          },
          {
            text: `Tanggal: ${ReportHelper.formatDate(sales.transactionDate)}`,
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 2],
      });

      content.push({
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            stack: [
              {
                columns: [
                  { text: "Subtotal:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(sales.subTotal),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Diskon:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(sales.discount),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Total:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(sales.totalAmount),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
              {
                columns: [
                  { text: "Laba Kotor:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(sales.totalGrossProfit),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
              {
                columns: [
                  { text: "Laba Bersih:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(sales.totalNetProfit),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      });

      // Items Table
      content.push({
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nama Barang", style: "tableHeader" },
              { text: "Varian", style: "tableHeader" },
              { text: "Qty", style: "tableHeader", alignment: "right" },
              { text: "Harga", style: "tableHeader", alignment: "right" },
              { text: "Diskon", style: "tableHeader", alignment: "right" },
              { text: "Harga Beli", style: "tableHeader", alignment: "right" },
              { text: "Laba Kotor", style: "tableHeader", alignment: "right" },
              { text: "Laba Bersih", style: "tableHeader", alignment: "right" },
            ],
            ...sales.items.map((item) => [
              item.itemName,
              item.variantName,
              { text: item.qty.toString(), alignment: "right" as const },
              {
                text: ReportHelper.formatCurrency(item.price),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.discount),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.buyPrice),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.grossProfit),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.netProfit),
                alignment: "right" as const,
              },
            ]),
          ],
        },
      });
    });

    const docDefinition: TDocumentDefinitions = {
      content: content,
      styles: ReportHelper.getStyles(),
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      pdfDoc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    });
  }

  async generateSalesReturnReport(
    data: SalesReturnReportItem[],
  ): Promise<Buffer> {
    const fonts = ReportHelper.getFonts();
    const printer = new PdfPrinter(fonts);

    const content: any[] = [
      { text: "Laporan Retur Penjualan", style: "header" },
    ];

    data.forEach((sales) => {
      content.push({
        text: sales.returnNumber,
        style: "subHeader",
        margin: [0, 15, 0, 5],
      });

      // Sales Header Info
      content.push({
        columns: [
          { text: `Ref Faktur: ${sales.invoiceNumberRef}` },
          {
            text: `Tanggal: ${ReportHelper.formatDate(sales.transactionDate)}`,
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 2],
      });

      content.push({
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            stack: [
              {
                columns: [
                  { text: "Subtotal:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(sales.subTotal),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Diskon:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(sales.discount),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Total:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(sales.totalAmount),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      });

      // Items Table
      content.push({
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nama Barang", style: "tableHeader" },
              { text: "Varian", style: "tableHeader" },
              { text: "Qty", style: "tableHeader", alignment: "right" },
              { text: "Harga", style: "tableHeader", alignment: "right" },
              { text: "Diskon", style: "tableHeader", alignment: "right" },
              { text: "Total", style: "tableHeader", alignment: "right" },
            ],
            ...sales.items.map((item) => [
              item.itemName,
              item.variantName,
              { text: item.qty.toString(), alignment: "right" as const },
              {
                text: ReportHelper.formatCurrency(item.price),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.discount),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(item.total),
                alignment: "right" as const,
              },
            ]),
          ],
        },
      });
    });

    const docDefinition: TDocumentDefinitions = {
      content: content,
      styles: ReportHelper.getStyles(),
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      pdfDoc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    });
  }

  async generateSellReport(data: SellReportItem[]): Promise<Buffer> {
    const fonts = ReportHelper.getFonts();
    const printer = new PdfPrinter(fonts);

    const content: any[] = [
      { text: "Laporan Penjualan (B2B)", style: "header" },
    ];

    data.forEach((item) => {
      content.push({
        text: item.invoiceNumber,
        style: "subHeader",
        margin: [0, 15, 0, 5],
      });

      // Header Info
      content.push({
        columns: [
          {
            text: [
              { text: "Customer (Member): ", bold: true },
              item.customerName,
              "\n",
              { text: "Jatuh Tempo: ", bold: true },
              ReportHelper.formatDate(item.dueDate),
            ],
          },
          {
            text: `Tanggal: ${ReportHelper.formatDate(item.transactionDate)}`,
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 5],
      });

      content.push({
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            stack: [
              {
                columns: [
                  { text: "Subtotal:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(item.subTotal),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Diskon:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(item.discount),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Pajak:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(item.tax),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Total:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(item.totalAmount),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
              {
                columns: [
                  { text: "Laba Kotor:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(item.totalGrossProfit),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
              {
                columns: [
                  { text: "Laba Bersih:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(item.totalNetProfit),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      });

      // Items Table
      content.push({
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nama Barang", style: "tableHeader" },
              { text: "Varian", style: "tableHeader" },
              { text: "Qty", style: "tableHeader", alignment: "right" },
              { text: "Harga", style: "tableHeader", alignment: "right" },
              { text: "Diskon", style: "tableHeader", alignment: "right" },
              { text: "Pajak", style: "tableHeader", alignment: "right" },
              { text: "Harga Beli", style: "tableHeader", alignment: "right" },
              { text: "Laba Kotor", style: "tableHeader", alignment: "right" },
              { text: "Laba Bersih", style: "tableHeader", alignment: "right" },
            ],
            ...item.items.map((detail) => [
              detail.itemName,
              detail.variantName,
              { text: detail.qty.toString(), alignment: "right" as const },
              {
                text: ReportHelper.formatCurrency(detail.price),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(detail.discount),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(detail.tax),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(detail.buyPrice),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(detail.grossProfit),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(detail.netProfit),
                alignment: "right" as const,
              },
            ]),
          ],
        },
      });
    });

    const docDefinition: TDocumentDefinitions = {
      content: content,
      styles: ReportHelper.getStyles(),
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      pdfDoc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    });
  }

  async generateSellReturnReport(
    data: SellReturnReportItem[],
  ): Promise<Buffer> {
    const fonts = ReportHelper.getFonts();
    const printer = new PdfPrinter(fonts);

    const content: any[] = [
      { text: "Laporan Retur Penjualan (B2B)", style: "header" },
    ];

    data.forEach((item) => {
      content.push({
        text: item.invoiceNumber,
        style: "subHeader",
        margin: [0, 15, 0, 5],
      });

      // Header Info
      content.push({
        columns: [
          {
            text: [{ text: "Customer: ", bold: true }, item.customerName],
          },
          {
            text: `Tanggal: ${ReportHelper.formatDate(item.transactionDate)}`,
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 5],
      });

      content.push({
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            stack: [
              {
                columns: [
                  { text: "Subtotal:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(item.subTotal),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Diskon:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(item.discount),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Pajak:", width: 60 },
                  {
                    text: ReportHelper.formatCurrency(item.tax),
                    alignment: "right",
                    width: 80,
                  },
                ],
              },
              {
                columns: [
                  { text: "Total:", width: 60, bold: true },
                  {
                    text: ReportHelper.formatCurrency(item.totalAmount),
                    alignment: "right",
                    width: 80,
                    bold: true,
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      });

      // Items Table
      content.push({
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nama Barang", style: "tableHeader" },
              { text: "Varian", style: "tableHeader" },
              { text: "Qty", style: "tableHeader", alignment: "right" },
              { text: "Harga", style: "tableHeader", alignment: "right" },
              { text: "Diskon", style: "tableHeader", alignment: "right" },
              { text: "Pajak", style: "tableHeader", alignment: "right" },
              { text: "Total", style: "tableHeader", alignment: "right" },
            ],
            ...item.items.map((detail) => [
              detail.itemName,
              detail.variantName,
              { text: detail.qty.toString(), alignment: "right" as const },
              {
                text: ReportHelper.formatCurrency(detail.price),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(detail.discount),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(detail.tax),
                alignment: "right" as const,
              },
              {
                text: ReportHelper.formatCurrency(detail.total),
                alignment: "right" as const,
              },
            ]),
          ],
        },
      });
    });

    const docDefinition: TDocumentDefinitions = {
      content: content,
      styles: ReportHelper.getStyles(),
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      pdfDoc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    });
  }

  async generateItemReport(data: ItemReportItem[]): Promise<Buffer> {
    const fonts = ReportHelper.getFonts();
    const printer = new PdfPrinter(fonts);

    const content: any[] = [
      { text: "Laporan Master Barang", style: "header", margin: [0, 0, 0, 20] },
      {
        table: {
          headerRows: 1,
          widths: [
            "auto",
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Kode", style: "tableHeader" },
              { text: "Nama", style: "tableHeader" },
              { text: "Stok", style: "tableHeader" },
              { text: "Kategori", style: "tableHeader" },
              { text: "Supplier", style: "tableHeader" },
              { text: "Unit", style: "tableHeader" },
              { text: "Conv", style: "tableHeader" },
              { text: "Harga Beli", style: "tableHeader" },
              { text: "Profit %", style: "tableHeader" },
              { text: "Profit", style: "tableHeader" },
              { text: "H. Jual", style: "tableHeader" },
            ],
            ...data.map((item) => {
              // Row styling
              const rowStyle = item.isFirstVariant ? {} : { color: "#555" };
              const noBorder = [false, false, false, false]; // Optional: remove border for better merge look?
              // For simple implementation, keep borders but empty text.

              return [
                {
                  text: item.isFirstVariant ? item.code : "",
                  style: "tableBody",
                },
                {
                  text: item.isFirstVariant ? item.name : "",
                  style: "tableBody",
                },
                {
                  text: item.isFirstVariant ? item.stock : "",
                  style: "tableBody",
                  alignment: "center",
                },
                {
                  text: item.isFirstVariant ? item.category : "",
                  style: "tableBody",
                },
                {
                  text: item.isFirstVariant ? item.supplier : "",
                  style: "tableBody",
                },
                { text: item.variantUnit, style: "tableBody" },
                { text: item.variantAmount, style: "tableBody" },
                {
                  text: ReportHelper.formatCurrency(item.buyPrice),
                  style: "tableBody",
                  alignment: "right",
                },
                {
                  text: `${item.profitPercentage}%`,
                  style: "tableBody",
                  alignment: "right",
                },
                {
                  text: ReportHelper.formatCurrency(item.profitAmount),
                  style: "tableBody",
                  alignment: "right",
                },
                {
                  text: ReportHelper.formatCurrency(item.sellPrice),
                  style: "tableBody",
                  alignment: "right",
                },
              ];
            }),
          ],
        },
      },
    ];

    const docDefinition = {
      content,
      styles: ReportHelper.getStyles(),
      defaultStyle: {
        fontSize: 9, // Smaller font for many columns
      },
      pageOrientation: "landscape", // Landscape for wide table
      pageSize: "A4",
    };

    return new Promise(async (resolve, reject) => {
      const pdfDoc = await printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    });
  }
  async generateMemberReport(data: MemberReportItem[]): Promise<Buffer> {
    const fonts = ReportHelper.getFonts();
    const printer = new PdfPrinter(fonts);

    const content: any[] = [{ text: "Laporan Member", style: "header" }];

    data.forEach((category) => {
      content.push({
        text: `Kategori: ${category.categoryName} (${category.categoryCode})`,
        style: "subHeader",
        margin: [0, 15, 0, 5],
      });

      content.push({
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto", "*", "auto"],
          body: [
            [
              { text: "Kode", style: "tableHeader" },
              { text: "Nama", style: "tableHeader" },
              { text: "No. HP", style: "tableHeader" },
              { text: "Email", style: "tableHeader" },
              { text: "Alamat", style: "tableHeader" },
              { text: "Tgl Daftar", style: "tableHeader" },
            ],
            ...category.members.map((member) => [
              member.code,
              member.name,
              member.phone,
              member.email,
              member.address,
              ReportHelper.formatDate(member.createdAt),
            ]),
          ],
        },
      });
    });

    const docDefinition: TDocumentDefinitions = {
      content: content,
      styles: ReportHelper.getStyles(),
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      pdfDoc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    });
  }
  async generateMemberPurchaseReport(
    data: MemberPurchaseReportItem[],
  ): Promise<Buffer> {
    const fonts = ReportHelper.getFonts();
    const printer = new PdfPrinter(fonts);

    const content: any[] = [
      { text: "Laporan Pembelian Member", style: "header" },
    ];

    content.push({
      style: "tableExample",
      table: {
        headerRows: 1,
        widths: ["auto", "*", "auto", "auto", "auto", "auto", "auto"],
        body: [
          [
            { text: "Kode", style: "tableHeader" },
            { text: "Nama", style: "tableHeader" },
            { text: "Kategori", style: "tableHeader" },
            { text: "No. HP", style: "tableHeader" },
            { text: "Email", style: "tableHeader" },
            { text: "Frekuensi", style: "tableHeader", alignment: "right" },
            { text: "Total", style: "tableHeader", alignment: "right" },
          ],
          ...data.map((item) => [
            item.code,
            item.name,
            item.category,
            item.phone,
            item.email,
            {
              text: item.totalPurchaseFrequency.toString(),
              alignment: "right" as const,
            },
            {
              text: ReportHelper.formatCurrency(item.totalPurchaseAmount),
              alignment: "right" as const,
            },
          ]),
        ],
      },
    });

    const docDefinition: TDocumentDefinitions = {
      content: content,
      styles: ReportHelper.getStyles(),
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      pdfDoc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    });
  }
}
