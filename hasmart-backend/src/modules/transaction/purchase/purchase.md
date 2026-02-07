# Transaction Purchase Module

Module untuk mengelola transaksi pembelian dari supplier (TransactionPurchase).

---

## Overview

Module ini menyediakan CRUD operations untuk pembelian barang dari supplier dengan fitur:

- Nested item dengan variant conversion
- Diskon bertingkat per item
- Automatic stock refresh via `RefreshStockService`
- Audit trail via `RecordAction`

---

## Files

| File                     | Description                                 |
| ------------------------ | ------------------------------------------- |
| `purchase.controller.ts` | HTTP request/response handlers              |
| `purchase.service.ts`    | Business logic, calculations, stock refresh |
| `purchase.route.ts`      | Route definitions                           |
| `purchase.validator.ts`  | Zod validation schemas                      |

---

## Dependencies

- `common/prisma` - Database access
- `common/jwt` - Auth middleware
- `transaction/refresh-stock` - Stock recalculation service

---

## API Endpoints

### List Purchases

```
GET /api/transaction/purchase
Authorization: Bearer <token>
```

**Query:** `search`, `page`, `limit`, `sort`, `sortBy`, `branchId`, `dateStart`, `dateEnd`

---

### Get by ID

```
GET /api/transaction/purchase/:purchaseId
Authorization: Bearer <token>
```

---

---

### Get by Invoice Number

```
GET /api/transaction/purchase/:invoiceNumber/invoice
Authorization: Bearer <token>
```

**Response:** Same as Get by ID.

### Create Purchase

```
POST /api/transaction/purchase
Authorization: Bearer <token>
```

**Body:**

```json
{
  "invoiceNumber": "TP-2026-001",
  "transactionDate": "2026-01-27T00:00:00Z",
  "dueDate": "2026-02-27T00:00:00Z",
  "masterSupplierId": 1,
  "branchId": 1,
  "notes": "Pembelian rutin",
  "taxPercentage": 0,
  "items": [
    {
      "masterItemVariantId": 5,
      "qty": 10,
      "purchasePrice": 50000,
      "discounts": [{ "percentage": 10 }, { "percentage": 5 }]
    }
  ]
}
```

---

### Update Purchase

```
PUT /api/transaction/purchase/:purchaseId
Authorization: Bearer <token>
```

---

### Delete Purchase (Soft Delete)

```
DELETE /api/transaction/purchase/:purchaseId
Authorization: Bearer <token>
```

---

## Business Rules

1. **Unique Items:** Setiap `masterItemVariantId` harus unique dalam 1 transaksi
2. **Conversion:** `totalQty` = `qty` × `recordedConversion` (dari variant.amount)
3. **Diskon Bertingkat:**
   - Dihitung secara cascading (potongan dari hasil sebelumnya)
   - `orderIndex` berdasarkan urutan array (1, 2, 3...)
4. **Header Calculation:**
   - `recordedSubTotalAmount` = Σ item.recordedSubTotalAmount
   - `recordedDiscountAmount` = Σ item.recordedDiscountAmount
   - `recordedTotalAmount` = (subTotal - discount) + tax
5. **Stock Refresh:** Otomatis trigger `RefreshStockService.refreshRealStock()` untuk setiap item
6. **Audit:** Setiap CREATE/UPDATE/DELETE tercatat di `RecordAction`

---

## Stock Impact

- CREATE: Stock **bertambah** (item masuk ke cabang)
- DELETE: Stock **berkurang** (pembatalan pembelian)
- UPDATE: Refresh stock untuk item lama dan baru
