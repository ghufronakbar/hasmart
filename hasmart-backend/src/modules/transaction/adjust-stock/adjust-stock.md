# Transaction Adjustment Module (Stock Opname)

Module untuk mengelola transaksi penyesuaian stok / stock opname (TransactionAdjustment).

---

## Overview

Module ini menyediakan operasi untuk stock opname dengan fitur:

- User input **actual quantity** (jumlah fisik yang dihitung)
- **Automatic gap calculation** (selisih antara stok fisik vs stok tercatat)
- Batch creation (bisa banyak item sekaligus)
- Skip item yang tidak ada selisih (stok sudah sesuai)
- Automatic stock refresh via `RefreshStockService`
- Audit trail via `RecordAction`
- **No update operation** (adjustment bersifat immutable, hanya bisa create atau delete)

---

## Files

| File                         | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| `adjust-stock.controller.ts` | HTTP request/response handlers                  |
| `adjust-stock.service.ts`    | Business logic, gap calculation, batch creation |
| `adjust-stock.route.ts`      | Route definitions                               |
| `adjust-stock.validator.ts`  | Zod validation schemas                          |

---

## Dependencies

- `common/prisma` - Database access
- `common/jwt` - Auth middleware
- `transaction/refresh-stock` - Stock recalculation service

---

## API Endpoints

### List Adjustments

```
GET /api/transaction/adjust-stock
Authorization: Bearer <token>
```

**Query:** `search`, `page`, `limit`, `sort`, `sortBy`, `branchId`, `dateStart`, `dateEnd`

---

### Get by ID

```
GET /api/transaction/adjust-stock/:adjustmentId
Authorization: Bearer <token>
```

---

### Create Adjustment (Stock Opname)

```
POST /api/transaction/adjust-stock
Authorization: Bearer <token>
```

**Body:**

```json
{
  "branchId": 1,
  "notes": "Stock opname akhir bulan Januari 2026",
  "items": [
    {
      "masterItemVariantId": 5,
      "actualQty": 50
    },
    {
      "masterItemVariantId": 8,
      "actualQty": 10
    }
  ]
}
```

> **Note:**

- User hanya input `actualQty` (jumlah fisik). Sistem otomatis hitung gap dengan stok tercatat.
- Logika akan mengecek, bahwa tidak bisa melakukan adjust stock untuk masterItemId yang sama (divalidasi dari masterItemVariant.masterItemId)

**Response:** Array of created adjustments (hanya item yang ada selisih)

---

### Delete Adjustment (Soft Delete)

```
DELETE /api/transaction/adjust-stock/:adjustmentId
Authorization: Bearer <token>
```

---

## Business Rules

1. **Unique Items:** Setiap `masterItemVariantId` harus unique dalam 1 request
2. **Gap Calculation:**
   - `targetStock` = `actualQty` × `recordedConversion` (convert to base unit)
   - `currentStock` = ambil dari `ItemBranch.recordedStock` (default 0 jika belum ada)
   - `totalGapAmount` = `targetStock` - `currentStock`
   - `gapAmount` = `totalGapAmount` ÷ `recordedConversion` (integer division)
3. **Skip Zero Gap:** Item dengan gap = 0 tidak disimpan (stok sudah sesuai)
4. **Batch Creation:** Satu request bisa menghasilkan multiple adjustment records
5. **No Update:** Adjustment tidak bisa di-update, hanya create atau delete
6. **Stock Refresh:** Otomatis trigger `RefreshStockService.refreshRealStock()`
7. **Audit:** Setiap CREATE/DELETE tercatat di `RecordAction`

---

## Gap Interpretation

- **Positive (+):** Barang fisik lebih banyak dari sistem (Found/Surplus)
- **Negative (-):** Barang fisik lebih sedikit dari sistem (Lost/Damaged/Shrinkage)
- **Zero (0):** Stok sesuai (tidak perlu adjustment)

---

## Stock Impact

- **CREATE:** Stock disesuaikan dengan `actualQty`
  - Gap positif → Stock bertambah
  - Gap negatif → Stock berkurang
- **DELETE:** Stock kembali ke kondisi sebelum adjustment
  - Gap positif → Stock berkurang (pembatalan surplus)
  - Gap negatif → Stock bertambah (pembatalan shrinkage)

---

## Example Calculation

**Scenario:**

- Current stock: 45 Pcs (dari sistem)
- Actual qty: 50 Pcs (hasil hitung fisik)
- Conversion: 1 Pack = 10 Pcs

**Calculation:**

1. `targetStock` = 50 × 10 = 500 Pcs (base unit)
2. `currentStock` = 45 Pcs
3. `totalGapAmount` = 500 - 45 = +455 Pcs
4. `gapAmount` = 455 ÷ 10 = 45 Pack (integer division)

**Result:** Adjustment record dengan `totalGapAmount = +455`, stock bertambah 455 Pcs.

---

## Notes

- Adjustment bersifat **immutable** (tidak ada update endpoint)
- Jika semua item tidak ada gap, akan error dengan pesan "Tidak ada penyesuaian yang diperlukan"
- Satu POST request bisa menghasilkan multiple adjustment records (satu per item yang ada gap)
- Input `actualQty` disimpan sebagai `finalAmount`
