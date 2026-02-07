# Transaction Sales Module (POS)

Module untuk mengelola transaksi penjualan kasir (TransactionSales).

---

## Overview

Module ini menyediakan CRUD operations untuk penjualan barang di kasir dengan fitur:

- **Auto-generated invoice number** format: `TS-{YYYYMMDD}-{NNNN}`
- Nested item dengan variant conversion
- Diskon bertingkat per item
- Optional member (masterMemberId nullable)
- Automatic stock refresh via `RefreshStockService`
- Audit trail via `RecordAction`

---

## Files

| File                  | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| `sales.controller.ts` | HTTP request/response handlers                                  |
| `sales.service.ts`    | Business logic, invoice generation, calculations, stock refresh |
| `sales.route.ts`      | Route definitions                                               |
| `sales.validator.ts`  | Zod validation schemas                                          |

---

## Dependencies

- `common/prisma` - Database access
- `common/jwt` - Auth middleware
- `transaction/refresh-stock` - Stock recalculation service

---

## API Endpoints

### List Sales

```
GET /api/transaction/sales
Authorization: Bearer <token>
```

**Query:** `search`, `page`, `limit`, `sort`, `sortBy`, `branchId`, `dateStart`, `dateEnd`

---

### Get by ID

```
GET /api/transaction/sales/:salesId
Authorization: Bearer <token>
```

---

---

### Get by Invoice Number

```
GET /api/transaction/sales/:invoiceNumber/invoice
Authorization: Bearer <token>
```

**Response:** Same as Get by ID.

### Create Sales

```
POST /api/transaction/sales
Authorization: Bearer <token>
```

**Body:**

```json
{
  "branchId": 1,
  "notes": "Customer minta bon kosong",
  "memberCode": "MBR001",
  "cashReceived": 100000,
  "paymentType": "CASH", // CASH, DEBIT, QRIS
  "items": [
    {
      "masterItemVariantId": 5,
      "discounts": [{ "percentage": 10 }]
    }
  ]
}
```

> **Note:** `invoiceNumber` tidak diinput, akan di-generate otomatis oleh backend. `memberCode` bisa dikosongkan untuk customer walk-in.

---

### Update Sales

```
PUT /api/transaction/sales/:salesId
Authorization: Bearer <token>
```

---

### Delete Sales (Soft Delete)

```
DELETE /api/transaction/sales/:salesId
Authorization: Bearer <token>
```

---

## Business Rules

1. **Invoice Generation:** `TS-{YYYYMMDD}-{SEQUENCE}` per branch per hari
2. **Unique Items:** Setiap `masterItemVariantId` harus unique dalam 1 transaksi
3. **Conversion:** `totalQty` = `qty` × `recordedConversion` (dari variant.amount)
4. **Diskon Bertingkat:** Dihitung secara cascading
5. **Header Calculation:**
   - `recordedSubTotalAmount` = Σ item.recordedSubTotalAmount
   - `recordedDiscountAmount` = Σ item.recordedDiscountAmount
   - `recordedTotalAmount` = subTotal - discount
6. **Stock Refresh:** Otomatis trigger `RefreshStockService.refreshRealStock()`
7. **Audit:** Setiap CREATE/UPDATE/DELETE tercatat di `RecordAction`

---

## Stock Impact

- CREATE: Stock **berkurang** (barang keluar dari gudang ke customer)
- DELETE: Stock **bertambah** (pembatalan penjualan)
- UPDATE: Refresh stock untuk item lama dan baru
