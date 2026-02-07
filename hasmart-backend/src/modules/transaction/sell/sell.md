# Transaction Sell Module (B2B/Wholesale)

Module untuk mengelola transaksi penjualan B2B/Grosir (TransactionSell).

---

## Overview

Module ini menyediakan CRUD operations untuk penjualan B2B dengan fitur:

- **Auto-generated invoice number** format: `INV-{YYYYMMDD}-{NNNN}`
- Transaction date dan due date (jatuh tempo)
- **Mandatory member** (customer B2B harus terdaftar)
- Tax calculation (PPN) dengan input percentage
- Nested item dengan variant conversion
- Diskon bertingkat per item
- Automatic stock refresh via `RefreshStockService`
- Audit trail via `RecordAction`

**Perbedaan dengan Sales (POS):**

- Sales: Retail/kasir, optional member, no tax, no due date
- Sell: B2B/wholesale, mandatory member, with tax, with due date

---

## Files

| File                 | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `sell.controller.ts` | HTTP request/response handlers                                     |
| `sell.service.ts`    | Business logic, invoice generation, tax calculation, stock refresh |
| `sell.route.ts`      | Route definitions                                                  |
| `sell.validator.ts`  | Zod validation schemas                                             |

---

## Dependencies

- `common/prisma` - Database access
- `common/jwt` - Auth middleware
- `transaction/refresh-stock` - Stock recalculation service

---

## API Endpoints

### List Sells

```
GET /api/transaction/sell
Authorization: Bearer <token>
```

**Query:** `search`, `page`, `limit`, `sort`, `sortBy`, `branchId`, `dateStart`, `dateEnd`

---

### Get by ID

```
GET /api/transaction/sell/:sellId
Authorization: Bearer <token>
```

---

### Get by Invoice Number

```
GET /api/transaction/sell/:invoiceNumber/invoice
Authorization: Bearer <token>
```

**Response:** Same as Get by ID.

### Create Sell

```
POST /api/transaction/sell
Authorization: Bearer <token>
```

**Body:**

```json
{
  "branchId": 1,
  "transactionDate": "2026-01-27T09:00:00Z",
  "dueDate": "2026-02-27T09:00:00Z",
  "memberCode": "MBR001",
  "notes": "Pengiriman ke Toko Sumber Rejeki",
  "taxPercentage": 11,
  "items": [
    {
      "masterItemVariantId": 5,
      "qty": 50,
      "sellPrice": 45000,
      "discounts": [{ "percentage": 2 }]
    }
  ]
}
```

> **Note:** `invoiceNumber` auto-generated. `memberCode` WAJIB diisi (B2B customer harus terdaftar).

---

### Update Sell

```
PUT /api/transaction/sell/:sellId
Authorization: Bearer <token>
```

---

### Delete Sell (Soft Delete)

```
DELETE /api/transaction/sell/:sellId
Authorization: Bearer <token>
```

---

## Business Rules

1. **Invoice Generation:** `INV-{YYYYMMDD}-{SEQUENCE}` per branch per hari
2. **Mandatory Member:** `memberCode` wajib diisi, lookup ke `masterMemberId`
3. **Unique Items:** Setiap `masterItemVariantId` harus unique dalam 1 transaksi
4. **Conversion:** `totalQty` = `qty` × `recordedConversion`
5. **Diskon Bertingkat:** Dihitung secara cascading per item
6. **Tax Calculation:**
   - Input: `taxPercentage` (0-100)
   - Tax Base (DPP) = `recordedSubTotalAmount` - `recordedDiscountAmount`
   - `recordedTaxAmount` = Tax Base × (`taxPercentage` / 100)
   - `recordedTotalAmount` = Tax Base + `recordedTaxAmount`
7. **Stock Refresh:** Otomatis trigger `RefreshStockService.refreshRealStock()`
8. **Audit:** Setiap CREATE/UPDATE/DELETE tercatat di `RecordAction`

---

## Stock Impact

- CREATE: Stock **berkurang** (barang keluar ke customer B2B)
- DELETE: Stock **bertambah** (pembatalan penjualan)
- UPDATE: Refresh stock untuk item lama dan baru
