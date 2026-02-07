# Report Generation Module Guide

**Context:** Implementasi fitur download laporan (Purchase Report) dalam format PDF dan Excel.
**Strategy:** Full Buffer (In-Memory), No Streaming.
**Libraries:** `pdfmake` (PDF), `exceljs` (Excel).

---

## PART 1: User Story

### Description

Sebagai **Admin/User**,
Saya ingin **mengunduh laporan pembelian (Purchase Report)** dalam format **PDF** atau **Excel (XLSX)**,
Agar **saya dapat menganalisa data secara offline, mencetaknya, atau membagikannya kepada tim manajemen.**

### Scope of Work

1.  **Backend Service:** Mengambil data transaksi dari database (Prisma).
2.  **PDF Generator:** Mengonversi data menjadi dokumen PDF menggunakan `pdfmake` (Buffer).
3.  **Excel Generator:** Mengonversi data menjadi file Excel menggunakan `exceljs` (Buffer).
4.  **Controller:** Mengatur HTTP Headers (`Content-Type`, `Content-Disposition`) agar browser mengenali response sebagai file unduhan.

### Acceptance Criteria

- [ ] Endpoint `GET /report?exportAs=pdf` mengembalikan file PDF.
- [ ] Endpoint `GET /report?exportAs=xlsx` mengembalikan file Excel.
- [ ] Format PDF memiliki header tabel dan layout yang rapi.
- [ ] Format Excel memiliki header dan data yang sesuai kolom.
- [ ] Response menggunakan **Buffer** (bukan Stream).
- [ ] Implementasi mengikuti struktur file yang sudah ada (`ReportPdfService`, `ReportXlsxService`).

---

## PART 2: Technical Architecture & Rules

### 1. Library Specifications

- **PDF:** Gunakan `pdfmake`.
  - Pastikan setup `printer` menggunakan font standar (Roboto atau default) untuk server-side rendering.
  - Return value harus berupa `Buffer`.
- **Excel:** Gunakan `exceljs`.
  - Gunakan `new ExcelJS.Workbook()`.
  - Gunakan `workbook.xlsx.writeBuffer()`.
- **Database:** Gunakan `PrismaService` yang sudah tersedia.

### 2. Flow of Execution

1.  **Controller (`ReportController`):**
    - Menerima request.
    - Memanggil `ReportService.getPurchaseReport`.
    - Menerima `Buffer` dan `FileName`.
    - Set Header (`Content-Type`, `Content-Disposition`).
    - Kirim Buffer ke client.
2.  **Main Service (`ReportService`):**
    - Query data mentah dari Prisma (`TransactionPurchase`).
    - Mapping data mentah menjadi interface `ReportItem`.
    - Switch logic `exportAs`:
      - Jika `pdf`: Panggil `ReportPdfService.generate(data)`.
      - Jika `xlsx`: Panggil `ReportXlsxService.generate(data)`.
3.  **Sub-Services (`ReportPdfService` / `ReportXlsxService`):**
    - Hanya fokus pada _styling_ dan _formatting_.
    - Input: `ReportItem[]`.
    - Output: `Buffer`.

### 3. Data Structure (Interface)

Definisikan interface ini di `report.interface.ts` untuk standarisasi data antar service.

```typescript
export interface PurchaseReportItem {
  id: number;
  transactionDate: Date;
  invoiceNumber: string;
  supplierName: string;
  totalAmount: number; // Decimal converted to number for reporting
  status?: string;
}

export interface ReportResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}
```

---

## PART 3: Implementation Guide (For AI Agent)

Ikuti langkah ini untuk melengkapi file yang kosong.

### Step 1: Install Dependencies

Pastikan library berikut terinstall:
`npm install pdfmake exceljs`
`npm install --save-dev @types/pdfmake`

### Step 2: Update `report.interface.ts`

Buat interface `PurchaseReportItem` dan `ReportResult` seperti definisi di atas.

### Step 3: Implement `ReportPdfService` (`report-pdf.service.ts`)

- Buat method `async generatePurchaseReport(data: PurchaseReportItem[]): Promise<Buffer>`.
- Setup `PdfPrinter` dari `pdfmake`.
- Definisikan `docDefinition` dengan tabel:
- Header: No, Date, Invoice, Supplier, Total.
- Body: Map dari `data`.

- Gunakan `printer.createPdfKitDocument` lalu convert chunk menjadi Buffer.

### Step 4: Implement `ReportXlsxService` (`report-xlsx.service.ts`)

- Buat method `async generatePurchaseReport(data: PurchaseReportItem[]): Promise<Buffer>`.
- Setup `new ExcelJS.Workbook()`.
- Setup Columns (width & header).
- Add Rows.
- Return `workbook.xlsx.writeBuffer()`.

### Step 5: Implement `ReportService` (`report.service.ts`)

- Di method `getPurchaseReport`, lakukan query ke Prisma `transactionPurchase`.
- Include `masterSupplier`.
- Gunakan `filter` dari parameter jika ada (tanggal, dll).
- Mapping hasil prisma ke `PurchaseReportItem[]`.
- Panggil sub-service berdasarkan `exportAs`.
- Return object `{ buffer, fileName, mimeType }`.

### Step 6: Update `ReportController` (`report.controller.ts`)

- Panggil service.
- Gunakan method native `res` express untuk set header.
- Contoh Helper (bisa ditaruh di BaseController nanti):

```typescript
res.setHeader("Content-Type", result.mimeType);
res.setHeader("Content-Disposition", `attachment; filename=${result.fileName}`);
res.send(result.buffer);
```
