# Report XLSX Service

Generates Excel files from data using `exceljs`.

## Implementation

- Uses `exceljs` `Workbook`.
- Output: Buffer (via `workbook.xlsx.writeBuffer()`).
- Layout:
  - Main Header: "Laporan Pembelian" (Bold, Size 14).
  - Transaction Block:
    - Header: Invoice Number (Bold).
    - Info Rows: Split key-value cells (e.g., "Supplier" | [Name], "Tanggal" | [DateObject]).
    - Items Table Header: Bold Indonesian headers (Nama Barang, Varian, Qty, Harga, Diskon, Pajak, Subtotal).
    - Items Rows: Detail data.
    - Summary Rows: Subtotal, Diskon, Pajak, Total (with number formatting `#,##0.00`).
- Formatting:
  - Dates: `d/m/yyyy` format.
  - Numbers: `#,##0.00` format for financials.
