# Transaction Transfer Module

Module untuk mengelola transaksi perpindahan stok antar cabang (TransactionTransfer).

---

## Overview

Module ini menyediakan CRUD operations untuk transfer stok dengan fitur:

- **Header-Detail structure** (1 dokumen transfer bisa berisi banyak item)
- Perpindahan stok dari cabang pengirim (`fromId`) ke cabang penerima (`toId`)
- Validasi self-transfer (fromId tidak boleh sama dengan toId)
- Nested item dengan variant conversion
- **Dual-side stock refresh** (refresh stok di kedua cabang)
- Automatic stock refresh via `RefreshStockService`
- Audit trail via `RecordAction`

---

## Files

| File                     | Description                             |
| ------------------------ | --------------------------------------- |
| `transfer.controller.ts` | HTTP request/response handlers          |
| `transfer.service.ts`    | Business logic, dual-side stock refresh |
| `transfer.route.ts`      | Route definitions                       |
| `transfer.validator.ts`  | Zod validation schemas                  |

---

## Dependencies

- `common/prisma` - Database access
- `common/jwt` - Auth middleware
- `transaction/refresh-stock` - Stock recalculation service

---

## API Endpoints

### List Transfers

```
GET /api/transaction/transfer
Authorization: Bearer <token>
```

**Query:** `search`, `page`, `limit`, `sort`, `sortBy`, `branchId`

---

### Get by ID

```
GET /api/transaction/transfer/:transferId
Authorization: Bearer <token>
```

---

### Create Transfer

```
POST /api/transaction/transfer
Authorization: Bearer <token>
```

**Body:**

```json
{
  "transactionDate": "2026-01-29T10:00:00Z",
  "fromId": 1,
  "toId": 2,
  "notes": "Dikirim menggunakan mobil box B 1234 CD, Driver: Udin",
  "items": [
    {
      "masterItemVariantId": 5,
      "qty": 10
    },
    {
      "masterItemVariantId": 8,
      "qty": 5
    }
  ]
}
```

> **Note:** `fromId` dan `toId` tidak boleh sama (self-transfer tidak diperbolehkan).

---

### Update Transfer

```
PUT /api/transaction/transfer/:transferId
Authorization: Bearer <token>
```

---

### Delete Transfer (Soft Delete)

```
DELETE /api/transaction/transfer/:transferId
Authorization: Bearer <token>
```

---

## Business Rules

1. **Self-Transfer Check:** `fromId` tidak boleh sama dengan `toId`
2. **Unique Items:** Setiap `masterItemVariantId` harus unique dalam 1 transaksi
3. **Branch Validation:** Kedua cabang (pengirim dan penerima) harus exist
4. **Conversion:** `totalQty` = `qty` × `recordedConversion`
5. **Dual-Side Stock Refresh:**
   - Refresh stok di cabang pengirim (`fromId`)
   - Refresh stok di cabang penerima (`toId`)
6. **Audit:** Setiap CREATE/UPDATE/DELETE tercatat di `RecordAction`

---

## Stock Impact

- **CREATE:**
  - Cabang pengirim (`fromId`): Stock **berkurang**
  - Cabang penerima (`toId`): Stock **bertambah**

- **DELETE:**
  - Cabang pengirim (`fromId`): Stock **bertambah** (pembatalan transfer)
  - Cabang penerima (`toId`): Stock **berkurang** (pembatalan transfer)

- **UPDATE:**
  - Refresh stock untuk item lama dan baru di kedua cabang
  - Jika cabang berubah, refresh juga cabang lama

---

## Notes

- Tidak ada perhitungan finansial (harga/diskon) pada transfer
- Transfer hanya mencatat perpindahan fisik barang
- Satu dokumen transfer dapat memuat banyak item (header-detail)
