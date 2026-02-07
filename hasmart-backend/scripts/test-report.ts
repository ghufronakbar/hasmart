import { ReportPdfService } from "../src/modules/report/report-pdf/report-pdf.service";
import { ReportXlsxService } from "../src/modules/report/report-xlsx/report-xlsx.service";
import fs from "fs";
import { PurchaseReportItem } from "../src/modules/report/report/report.interface";

async function run() {
  const pdfService = new ReportPdfService();
  const xlsxService = new ReportXlsxService();

  const data: PurchaseReportItem[] = [
    {
      id: 1,
      transactionDate: new Date(),
      invoiceNumber: "INV-001",
      supplierName: "Supplier A",
      subTotal: 100000,
      discount: 0,
      tax: 11000,
      totalAmount: 111000,
      items: [
        {
          itemName: "Item A",
          variantName: "PCS",
          qty: 10,
          price: 10000,
          discount: 0,
          tax: 1100,
          total: 101100,
        },
      ],
    },
    {
      id: 2,
      transactionDate: new Date(),
      invoiceNumber: "INV-002",
      supplierName: "Supplier B",
      subTotal: 250000,
      discount: 10000,
      tax: 26400,
      totalAmount: 266400,
      items: [
        {
          itemName: "Item B",
          variantName: "BOX",
          qty: 5,
          price: 50000,
          discount: 2000,
          tax: 5280,
          total: 53280,
        },
      ],
    },
  ];

  try {
    console.log("Generating PDF...");
    const pdfBuffer = await pdfService.generatePurchaseReport(data);
    fs.writeFileSync("test-report.pdf", pdfBuffer);
    console.log("PDF created: test-report.pdf, size:", pdfBuffer.length);

    console.log("Generating Excel...");
    const xlsxBuffer = await xlsxService.generatePurchaseReport(data);
    fs.writeFileSync("test-report.xlsx", xlsxBuffer);
    console.log("Excel created: test-report.xlsx, size:", xlsxBuffer.length);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
