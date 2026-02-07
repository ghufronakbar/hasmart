# Receipt Module

Module untuk mendapatkan data receipt.

## Endpoints

### Get Sales Receipt By Date

`GET /receipt/sales`

Mendapatkan laporan penjualan harian per kasir.

**Query Params:**

- `date`: Tanggal laporan (YYYY-MM-DD)
- `branchId`: ID Cabang

**Response:**

```json
{
  "branch": { ... },
  "date": "2024-01-01T00:00:00.000Z",
  "cashierName": "John Doe",
  "totalTransaction": 10,
  "totalAmount": "1000000",
  "totalReturn": "0",
  "paymentType": {
    "CASH": "500000",
    "DEBIT": "300000",
    "QRIS": "200000"
  },
  "cashIncome": "500000",
  "balance": "500000"
}
```
