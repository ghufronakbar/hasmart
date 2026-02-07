# Transaction Purchase Return Module

Module untuk mengelola transaksi retur pembelian ke supplier (TransactionPurchaseReturn).

---

## Overview

Module ini menyediakan CRUD operations untuk retur barang ke supplier dengan fitur:

- Nested item dengan variant conversion
- Diskon bertingkat per item
- **Stock Impact**: Increasing stock for returned items.
- **Original Invoice**: Must provide a valid `originalInvoiceNumber` which exists in `TransactionPurchase` and is not deleted. The return will be linked to this purchase.
- Audit trail via `RecordAction`

**Note:** Module ini memiliki foreign key ke `TransactionPurchase` (`transactionPurchaseId`) dan akan memvalidasi keberadaan invoice asal.

---

## Files

| File                            | Description                                 |
| :------------------------------ | :------------------------------------------ |
| `purchase-return.controller.ts` | HTTP request/response handlers              |
| `purchase-return.service.ts`    | Business logic, calculations, stock refresh |
| `purchase-return.route.ts`      | Route definitions                           |
| `purchase-return.validator.ts`  | Zod validation schemas                      |

---

## Dependencies

- `common/prisma` - Database access
- `common/jwt` - Auth middleware
- `transaction/refresh-stock` - Stock recalculation service

---

## API Endpoints

### List Purchase Returns

```
GET /api/transaction/purchase-return
Authorization: Bearer <token>
```

**Query:** `search`, `page`, `limit`, `sort`, `sortBy`, `branchId`, `dateStart`, `dateEnd`

---

### Get by ID

```
GET /api/transaction/purchase-return/:purchaseReturnId
Authorization: Bearer <token>
```

---

### Create Purchase Return

```
POST /api/transaction/purchase-return
Authorization: Bearer <token>
```

**Body:**

```json
{
  "invoiceNumber": "RET-2026-001",
  "date": "2024-01-28",
  "originalInvoiceNumber": "INV/20240128/0001",
  "dueDate": "2026-02-28T00:00:00Z",
  "masterSupplierId": 1,
  "branchId": 1,
  "notes": "Barang rusak kemasan",
  "taxPercentage": 0,
  "items": [
    {
      "masterItemVariantId": 5,
      "qty": 2,
      "purchasePrice": 50000,
      "discounts": [{ "percentage": 10 }]
    }
  ]
}
```

---

### Update Purchase Return

```
PUT /api/transaction/purchase-return/:purchaseReturnId
Authorization: Bearer <token>
```

---

### Delete Purchase Return (Soft Delete)

```
DELETE /api/transaction/purchase-return/:purchaseReturnId
Authorization: Bearer <token>
```

---

## Business Rules

1. **Unique Items:** Setiap `masterItemVariantId` harus unique dalam 1 transaksi
2. **Conversion:** `totalQty` = `qty` × `recordedConversion` (dari variant.amount)
3. **Diskon Bertingkat:** Dihitung secara cascading
4. **Stock Refresh:** Otomatis trigger `RefreshStockService.refreshRealStock()`
5. **Audit:** Setiap CREATE/UPDATE/DELETE tercatat di `RecordAction`

---

## Stock Impact

- CREATE: Stock **berkurang** (barang keluar kembali ke supplier)
- DELETE: Stock **bertambah** (pembatalan retur)
- UPDATE: Refresh stock untuk item lama dan baru
