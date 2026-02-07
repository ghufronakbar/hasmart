# Report PDF Service

Generates PDF files from data using `pdfmake`.

## Implementation

- Uses `pdfmake` with server-side `Printer`.
- Fonts: Uses default Roboto fonts from `pdfmake` node_modules.
- Output: Buffer.
- Layout:
  - Header: "Laporan Pembelian".
  - Transaction Block:
    - Subheader: Invoice Number.
    - Info: Supplier, Date.
    - Items Table: Nested table with Indonesian headers (Nama Barang, Varian, Qty, Harga, Diskon, Pajak, Subtotal).
    - Summary Stack: Subtotal, Diskon, Pajak, Total.
- Language: Indonesian headers.
