# Transaction Sell Return Module (B2B Return)

Module untuk mengelola transaksi retur penjualan B2B (TransactionSellReturn).

---

## Overview

Module ini menyediakan CRUD operations untuk retur penjualan B2B dengan fitur:

- **Auto-generated return number** format: `RTG-{YYYYMMDD}-{NNNN}` (Retur Grosir)
- Transaction date dan due date (jatuh tempo)
- **Mandatory member** (customer B2B harus terdaftar)
- Tax calculation (PPN) dengan input percentage
- Nested item dengan variant conversion
- Diskon bertingkat per item
- Automatic stock refresh via `RefreshStockService`
- Audit trail via `RecordAction`

**Perbedaan dengan Sales Return (POS Return):**

- Sales Return: Retail/kasir return, optional member, no tax, no due date
- Sell Return: B2B return, mandatory member, with tax, with due date

---

## Files

| File                        | Description                                                              |
| --------------------------- | ------------------------------------------------------------------------ |
| `sell-return.controller.ts` | HTTP request/response handlers                                           |
| `sell-return.service.ts`    | Business logic, return number generation, tax calculation, stock refresh |
| `sell-return.route.ts`      | Route definitions                                                        |
| `sell-return.validator.ts`  | Zod validation schemas                                                   |

---

## Dependencies

- `common/prisma` - Database access
- `common/jwt` - Auth middleware
- `transaction/refresh-stock` - Stock recalculation service

---

## API Endpoints

### List Sell Returns

```
GET /api/transaction/sell-return
Authorization: Bearer <token>
```

**Query:** `search`, `page`, `limit`, `sort`, `sortBy`, `branchId`, `dateStart`, `dateEnd`

---

### Get by ID

```
GET /api/transaction/sell-return/:sellReturnId
Authorization: Bearer <token>
```

---

### Create Sell Return

```
POST /api/transaction/sell-return
Authorization: Bearer <token>
```

**Body:**

```json
{
  "branchId": 1,
  "transactionDate": "2026-01-28T09:00:00Z",
  "dueDate": "2026-02-28T09:00:00Z",
  "memberCode": "MBR001",
  "originalInvoiceNumber": "INV-20260127-0001",
  "notes": "Retur barang rusak pengiriman",
  "taxPercentage": 11,
  "items": [
    {
      "masterItemVariantId": 5,
      "qty": 5,
      "sellPrice": 48000,
      "discounts": [{ "percentage": 2 }]
    }
  ]
}
```

> **Note:** `invoiceNumber` (return number) auto-generated. `memberCode` WAJIB diisi.

---

### Update Sell Return

```
PUT /api/transaction/sell-return/:sellReturnId
Authorization: Bearer <token>
```

---

### Delete Sell Return (Soft Delete)

```
DELETE /api/transaction/sell-return/:sellReturnId
Authorization: Bearer <token>
```

---

## Business Rules

1. **Return Number:** Auto-generated `RTG-{YYYYMMDD}-{SEQUENCE}` per branch per hari
2. **Mandatory Member:** `memberCode` wajib diisi, lookup ke `masterMemberId`
3. **Mandatory Original Invoice:** `originalInvoiceNumber` wajib diisi, validasi ke `TransactionSell`
4. **Unique Items:** Setiap `masterItemVariantId` harus unique dalam 1 transaksi
5. **Conversion:** `totalQty` = `qty` × `recordedConversion`
6. **Diskon Bertingkat:** Dihitung secara cascading per item
7. **Tax Calculation (Refund Tax):**
   - Input: `taxPercentage` (0-100)
   - Tax Base (DPP) = `recordedSubTotalAmount` - `recordedDiscountAmount`
   - `recordedTaxAmount` = Tax Base × (`taxPercentage` / 100)
   - `recordedTotalAmount` = Tax Base + `recordedTaxAmount`
8. **Stock Refresh:** Otomatis trigger `RefreshStockService.refreshRealStock()`
9. **Audit:** Setiap CREATE/UPDATE/DELETE tercatat di `RecordAction`

---

## Stock Impact

- CREATE: Stock **bertambah** (barang kembali ke gudang dari customer B2B)
- DELETE: Stock **berkurang** (pembatalan retur)
- UPDATE: Refresh stock untuk item lama dan baru
