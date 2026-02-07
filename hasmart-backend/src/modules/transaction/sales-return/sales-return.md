# Transaction Sales Return Module

Module untuk mengelola transaksi retur penjualan dari customer (TransactionSalesReturn).

---

## Overview

Module ini menyediakan CRUD operations untuk retur barang dari customer dengan fitur:

- **Auto-generated return number** format: `TSR-{YYYYMMDD}-{NNNN}`
- Referensi ke invoice penjualan asli via `originalInvoiceNumber`
- Nested item dengan variant conversion
- Diskon bertingkat per item
- Otomatis copy `masterMemberId` dari invoice asli
- Automatic stock refresh via `RefreshStockService`
- Audit trail via `RecordAction`

---

## Files

| File                         | Description                                                 |
| ---------------------------- | ----------------------------------------------------------- |
| `sales-return.controller.ts` | HTTP request/response handlers                              |
| `sales-return.service.ts`    | Business logic, invoice lookup, calculations, stock refresh |
| `sales-return.route.ts`      | Route definitions                                           |
| `sales-return.validator.ts`  | Zod validation schemas                                      |

---

## Dependencies

- `common/prisma` - Database access
- `common/jwt` - Auth middleware
- `transaction/refresh-stock` - Stock recalculation service

---

## API Endpoints

### List Sales Returns

```
GET /api/transaction/sales-return
Authorization: Bearer <token>
```

**Query:** `search`, `page`, `limit`, `sort`, `sortBy`, `branchId`, `dateStart`, `dateEnd`

---

### Get by ID

```
GET /api/transaction/sales-return/:salesReturnId
Authorization: Bearer <token>
```

---

### Create Sales Return

```
POST /api/transaction/sales-return
Authorization: Bearer <token>
```

**Body:**

```json
{
  "branchId": 1,
  "originalInvoiceNumber": "TS-20260127-0001",
  "notes": "Barang cacat produksi",
  "items": [
    {
      "masterItemVariantId": 5,
      "qty": 1,
      "salesPrice": 55000,
      "discounts": [{ "percentage": 10 }]
    }
  ]
}
```

> **Note:** `returnNumber` auto-generated. `masterMemberId` otomatis diambil dari invoice asli.

---

### Update Sales Return

```
PUT /api/transaction/sales-return/:salesReturnId
Authorization: Bearer <token>
```

---

### Delete Sales Return (Soft Delete)

```
DELETE /api/transaction/sales-return/:salesReturnId
Authorization: Bearer <token>
```

---

## Business Rules

1. **Return Number:** Auto-generated `TSR-{YYYYMMDD}-{SEQUENCE}` per branch per hari
2. **Invoice Validation:** `originalInvoiceNumber` wajib ada dan valid (existing TransactionSales)
3. **Member Copy:** `masterMemberId` otomatis diambil dari invoice asli
4. **Unique Items:** Setiap `masterItemVariantId` harus unique dalam 1 transaksi
5. **Conversion:** `totalQty` = `qty` × `recordedConversion`
6. **Diskon Bertingkat:** Dihitung secara cascading
7. **Stock Refresh:** Otomatis trigger `RefreshStockService.refreshRealStock()`
8. **Audit:** Setiap CREATE/UPDATE/DELETE tercatat di `RecordAction`

---

## Stock Impact

- CREATE: Stock **bertambah** (barang kembali ke gudang dari customer)
- DELETE: Stock **berkurang** (pembatalan retur)
- UPDATE: Refresh stock untuk item lama dan baru
