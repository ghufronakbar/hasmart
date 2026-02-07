# Revision 01: Move Code from MasterItemVariant to MasterItem

## Overview

Sebelumnya pada model `MasterItemVariant` terdapat `code String @unique @map("code")`, namun pada case asli, yang nanti digunakan code nya adalah code yang per satuan (per item), jadi untuk `code` di `MasterItemVariant` tidak perlu dan sebagai gantinya ada di model `MasterItem`.

---

## Status: ✅ SELESAI (Backend)

---

## Checklist Backend

- [x] **BE - Update schema.prisma** (dikerjakan pengguna)
  - Memindahkan `code` dari `MasterItemVariant` ke `MasterItem`
  - Menjalankan migrasi database

- [x] **BE - Update item.validator.ts**
  - Menambahkan `code` ke `ItemBodySchema` (required)
  - Menghapus `code` dari `VariantBodySchema` dan `ItemBodySchema.masterItemVariants`
  - Rename `GetVariantParamsSchema` → `GetItemByCodeParamsSchema`
  - Rename `GetVariantParamsType` → `GetItemByCodeParamsType`

- [x] **BE - Update item.service.ts**
  - Rename `getVariantByCode` → `getItemByCode`
  - Query berubah dari `masterItemVariant.findFirst` → `masterItem.findFirst`
  - Return sekarang `MasterItem` dengan variants, bukan `MasterItemVariant`
  - Update `createItem` untuk validasi duplicate item code
  - Remove code handling dari `createVariant` dan `updateVariant`

- [x] **BE - Update item.controller.ts**
  - Rename method `getVariantByCode` → `getItemByCode`
  - Update type import dari `GetVariantParamsType` → `GetItemByCodeParamsType`

- [x] **BE - Update item.route.ts**
  - Route berubah dari `/:masterItemCode/variant` → `/code/:code`
  - Update validator import dan usage

- [x] **BE - Update item.interface.ts**
  - Menghapus `code` dari `ItemVariantResponse`
  - Menambahkan `code` ke `ItemResponse` dan `ItemListResponse`

- [x] **BE - Update item.md**
  - Update dokumentasi endpoint `Get Item By Code`
  - Update Create Item body schema (code sekarang di level item)
  - Update Variant body schema (sudah tidak ada code)
  - Update business rules

- [x] **BE - Update services lain yang terdampak**

  9 service file diupdate untuk mengambil `code` dari `masterItem` bukan `masterItemVariant`:

  | File                         | Perubahan                                                 |
  | ---------------------------- | --------------------------------------------------------- |
  | `adjust-stock.service.ts`    | Include `masterItem.code`, hapus `masterItemVariant.code` |
  | `purchase.service.ts`        | Include `masterItem.code`, hapus `masterItemVariant.code` |
  | `purchase-return.service.ts` | Include `masterItem.code`, hapus `masterItemVariant.code` |
  | `sales.service.ts`           | Include `masterItem.code`, hapus `masterItemVariant.code` |
  | `sales-return.service.ts`    | Include `masterItem.code`, hapus `masterItemVariant.code` |
  | `sell.service.ts`            | Include `masterItem.code`, hapus `masterItemVariant.code` |
  | `sell-return.service.ts`     | Include `masterItem.code`, hapus `masterItemVariant.code` |
  | `transfer.service.ts`        | Include `masterItem.code`, hapus `masterItemVariant.code` |
  | `overview.service.ts`        | Low stock items sekarang ambil `masterItem.code`          |

---

## API Changes

### Endpoint Baru

| Sebelum                                        | Sesudah                              |
| ---------------------------------------------- | ------------------------------------ |
| `GET /api/master/item/:masterItemCode/variant` | `GET /api/master/item/code/:code`    |
| Returns `MasterItemVariant`                    | Returns `MasterItem` dengan variants |

### Create Item Body

```json
// SEBELUM
{
  "name": "Detergen ABC",
  "masterSupplierId": 1,
  "masterItemCategoryId": 1,
  "isActive": true,
  "masterItemVariants": [
    {
      "code": "DET001",      // <-- code di variant
      "unit": "PCS",
      "amount": 1,
      "sellPrice": 15000,
      "isBaseUnit": true
    }
  ]
}

// SESUDAH
{
  "name": "Detergen ABC",
  "code": "DET001",           // <-- code di item level
  "masterSupplierId": 1,
  "masterItemCategoryId": 1,
  "isActive": true,
  "masterItemVariants": [
    {
      "unit": "PCS",          // <-- tidak ada code
      "amount": 1,
      "sellPrice": 15000,
      "isBaseUnit": true
    }
  ]
}
```

### Item Response

```typescript
// SEBELUM
interface ItemVariantResponse {
  id: number;
  code: string; // <-- code di variant
  unit: string;
  // ...
}

// SESUDAH
interface ItemResponse {
  id: number;
  name: string;
  code: string; // <-- code di item
  // ...
  masterItemVariants: ItemVariantResponse[]; // variants tidak punya code
}
```

---

## Checklist Frontend

- [x] **FE - Update items page** (`master/items/page.tsx`)
  - Form create/edit: pindahkan input code dari variant ke item
  - Tabel: tampilkan code dari item, bukan variant
  - Variant form: hapus input code
- [x] **FE - Update POS page** (`point-of-sales/page.tsx`)
  - API call: ganti endpoint dari `/:code/variant` → `/code/:code`
  - Response handling: sesuaikan dengan response baru (code di item)
  - Variant display: ubah dari code ke unit (amount)

- [x] **FE - Update service API** (`services/master/item.service.ts`)
  - Rename `getVariantByCode` → `getItemByCode`
  - Update endpoint ke `/master/item/code/:code`

- [x] **FE - Update hook** (`hooks/master/use-item.ts`)
  - Rename `useItemVariantByCode` → `useItemByCode`

- [x] **FE - Update types/interfaces** (`types/master/item.ts`)
  - Hapus `code` dari interface `ItemVariant`
  - Tambah `code` ke interface `Item`

- [x] **FE - Update transaction pages** (semua variant selector)
  - `adjust-stock/page.tsx` - variant display dan selector
  - `purchase/page.tsx` - variant selector
  - `purchase-return/page.tsx` - variant selector
  - `sales/page.tsx` - variant selector
  - `sales-return/page.tsx` - variant selector
  - `sell/page.tsx` - variant selector
  - `sell-return/page.tsx` - variant selector
  - `transfer/page.tsx` - variant display dan selector

---

## Notes

- Code item bersifat unique secara global
- Code otomatis dikonversi ke uppercase
- Jika create item dengan code yang sudah di-soft-delete, akan restore item tersebut
- Variant selector sekarang menampilkan `unit (amount)` bukan `code - unit`
