# Item Module

Module untuk mengelola master item (MasterItem) dan variant-nya (MasterItemVariant).

---

## Overview

Module ini menyediakan CRUD operations untuk entity `MasterItem` dan nested CRUD untuk `MasterItemVariant`. Mendukung query stok berdasarkan branch.

---

## Files

| File                 | Description                          |
| -------------------- | ------------------------------------ |
| `item.controller.ts` | HTTP request/response handlers       |
| `item.service.ts`    | Business logic & database operations |
| `item.route.ts`      | Route definitions                    |
| `item.validator.ts`  | Zod validation schemas               |
| `item.interface.ts`  | Response type interfaces             |

---

## Dependency

- `common/prisma` - Database access
- `common/jwt` - Auth middleware

---

## API Endpoints

### List Items

```
GET /api/master/item
Authorization: Bearer <token>
```

**Query Parameters:**

- `search` - Search by name or code
- `page`, `limit`, `sort`, `sortBy` - Pagination
- `branchId` (optional) - Filter stock by branch

**Response:** Includes `stock` field (global atau branch-specific berdasarkan query)

---

### Get Item by ID

```
GET /api/master/item/:masterItemId
Authorization: Bearer <token>
```

**Query Parameters:**

- `branchId` (optional) - Get stock for specific branch

---

### Get Item by Code

Retrieve a specific item by its unique code.

```
GET /api/master/item/code/:code
Authorization: Bearer <token>
```

**Parameters:**

- `code` (Path Param) - The code of the item (e.g. `DET001`)

**Response:**

Returns `MasterItem` object including `masterItemVariants`.

---

### Create Item

```
POST /api/master/item
Authorization: Bearer <token>
```

**Body:**

```json
{
  "name": "Detergen Merk ABC",
  "code": "DET001",
  "masterSupplierId": 1,
  "masterItemCategoryId": 1,
  "isActive": true,
  "masterItemVariants": [
    {
      "unit": "PCS",
      "amount": 1,
      "sellPrice": 15000,
      "isBaseUnit": true
    },
    {
      "unit": "PACK",
      "amount": 12,
      "sellPrice": 170000,
      "isBaseUnit": false
    }
  ]
}
```

> **Note:** Minimal harus ada 1 variant. Code di level item, bukan di variant.

---

### Update Item

```
PUT /api/master/item/:masterItemId
Authorization: Bearer <token>
```

**Body:**

```json
{
  "name": "Detergen Merk ABC Updated",
  "masterSupplierId": 1,
  "masterItemCategoryId": 1,
  "isActive": true,
  "masterItemVariants": [
    {
      "id": 101,
      "unit": "PCS",
      "amount": 1,
      "sellPrice": 16000,
      "action": "update"
    },
    {
      "unit": "BOX",
      "amount": 24,
      "sellPrice": 350000,
      "action": "create"
    },
    {
      "id": 102,
      "unit": "PACK",
      "amount": 12,
      "sellPrice": 180000,
      "action": "delete"
    }
  ]
}
```

> **Note:**
>
> - `action` wajib: `"create" | "update" | "delete"`
> - `id` wajib untuk action `"update"` dan `"delete"`
> - Harus menyisakan minimal 1 `baseUnit` (`amount: 1`) yang tidak didelete.

---

---

## Response Interface

```typescript
interface ItemResponse {
  id: number;
  name: string;
  code: string;
  masterItemCategoryId: number;
  masterSupplierId: number;
  isActive: boolean;
  recordedBuyPrice: number;
  stock: number; // Global stock atau branch-specific
  masterItemCategory: { id; code; name };
  masterSupplier: { id; code; name };
  masterItemVariants: ItemVariantResponse[];
  createdAt: Date;
  updatedAt: Date;
}

interface ItemVariantResponse {
  id: number;
  unit: string;
  amount: number;
  recordedBuyPrice: number;
  recordedProfitPercentage: number;
  recordedProfitAmount: number;
  sellPrice: number;
  isBaseUnit: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

> **Important:** Key `stock` selalu sama, baik tanpa/dengan `branchId`. Nilainya berbeda berdasarkan query.

---

## Business Rules

- Supplier dan Category harus valid (tidak deleted)
- Item code harus unique secara global
- Item code otomatis uppercase
- Jika create dengan code yang sudah di-soft-delete, akan restore
- Item harus memiliki minimal 1 variant
- Soft delete dengan `deletedAt`

---

## Database Models

- `MasterItem` - Item master data (termasuk `code`)
- `MasterItemVariant` - Unit/packaging variants
- `ItemBranch` - Stock per branch (pivot)
