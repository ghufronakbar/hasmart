# Module Overview (Dashboard Analytics)

## 1. Overview

**OverviewService** adalah service _read-only_ yang bertugas menyajikan ringkasan kesehatan bisnis secara _real-time_. Data yang disajikan merupakan hasil agregasi dari berbagai modul transaksi (Sales, Sell, Purchase, Inventory).

Tujuannya adalah memberikan "Helicopter View" kepada Admin/Owner mengenai Omzet, Pengeluaran, Tren Penjualan, dan Stok Kritis.

## 2. Dependencies

- **PrismaService:** Untuk melakukan query agregasi (`aggregate`, `groupBy`, `count`).

## 3. Endpoints

### GET /api/overview/financial-summary

**Deskripsi:** Menghitung total nominal uang masuk dan keluar.

**Middleware:** `useAuth`, `useBranch`, `useFilter`

**Query Parameters (dari useFilter):**

- `dateStart?: string` - Tanggal mulai (fallback: 1 tahun lalu)
- `dateEnd?: string` - Tanggal akhir (fallback: hari ini)

**Query Parameters (dari useBranch):**

- `branchId?: number` - Filter per cabang (jika kosong = global)

**Response:**

```json
{
  "grossSales": 160000000,
  "totalReturns": 10000000,
  "netSales": 150000000,
  "netPurchase": 80000000,
  "transactionCount": 150
}
```

---

### GET /api/overview/sales-trend

**Deskripsi:** Data penjualan per hari dalam rentang tanggal.

**Middleware:** `useAuth`, `useBranch`, `useFilter`

**Response:**

```json
[
  { "date": "2026-01-01", "value": 5000000 },
  { "date": "2026-01-02", "value": 7500000 }
]
```

---

### GET /api/overview/top-products

**Deskripsi:** 5 produk terlaris berdasarkan kuantitas terjual.

**Middleware:** `useAuth`, `useBranch`, `useFilter`

**Response:**

```json
[
  { "name": "Indomie Goreng", "soldQty": 500, "revenue": 1500000 },
  { "name": "Kopi Kapal Api", "soldQty": 300, "revenue": 900000 }
]
```

---

### GET /api/overview/stock-alerts

**Deskripsi:** Barang dengan stok ≤ 10.

**Middleware:** `useAuth`, `useBranch`

**Response:**

```json
[
  {
    "name": "Rokok Sampoerna Mild",
    "code": "RSM001",
    "currentStock": 2,
    "unit": "PACK"
  }
]
```

## 4. Business Logic

### Financial Summary Calculation

- **Gross Sales:** `TransactionSales.recordedTotalAmount + TransactionSell.recordedTotalAmount`
- **Total Returns:** `TransactionSalesReturn.recordedTotalAmount + TransactionSellReturn.recordedTotalAmount`
- **Net Sales:** `Gross Sales - Total Returns`
- **Net Purchase:** `TransactionPurchase.recordedTotalAmount - TransactionPurchaseReturn.recordedTotalAmount`
- **Transaction Count:** Count of `TransactionSales + TransactionSell`

### Sales Trend Aggregation

1. Query `TransactionSales` and `TransactionSell`
2. Select `transactionDate` and `recordedTotalAmount`
3. Group by date (YYYY-MM-DD)
4. Sum amount per day

### Top Products Logic

1. Query `TransactionSalesItem` within date range
2. Group by `masterItemId`, sum `totalQty` and `recordedTotalAmount`
3. Order by qty descending, take 5
4. Hydrate with `MasterItem.name`

### Low Stock Alert Logic

1. Query `ItemBranch` where `recordedStock <= 10`
2. Filter `masterItem.isActive = true`
3. Include `masterItem.name`, base variant `code` and `unit`
4. Order by `recordedStock` ASC, take 10

## 5. Security & Constraints

1. **Authorization:** Semua endpoint memerlukan `useAuth` (Bearer token)
2. **Performance:**
   - Query agregasi dijalankan paralel dengan `Promise.all`
   - Hanya field yang diperlukan yang diambil (`select`)
3. **Date Fallback:** Jika `dateStart`/`dateEnd` tidak diberikan, default ke 1 tahun terakhir
