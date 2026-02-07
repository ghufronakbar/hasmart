# Item Category Module

Module untuk mengelola kategori barang (MasterItemCategory).

---

## Overview

Module ini menyediakan CRUD operations untuk entity `MasterItemCategory` yang merepresentasikan kategori barang. Fitur khusus: jika membuat kategori dengan code yang sudah di-soft-delete, sistem akan restore kategori tersebut.

---

## Files

| File                          | Description                          |
| ----------------------------- | ------------------------------------ |
| `item-category.controller.ts` | HTTP request/response handlers       |
| `item-category.service.ts`    | Business logic & database operations |
| `item-category.route.ts`      | Route definitions                    |
| `item-category.validator.ts`  | Zod validation schemas               |

---

## Dependency

- `common/prisma` - Database access

---

## API Endpoints

### List Item Categories

```
GET /api/master/item-category
```

**Query Parameters:** `search`, `page`, `limit`, `sort`, `sortBy`

---

### Get Item Category by ID

```
GET /api/master/item-category/:itemCategoryId
```

---

### Create Item Category

```
POST /api/master/item-category
```

**Body:**

```json
{
  "code": "DET",
  "name": "Detergen"
}
```

> **Note:** Jika code sudah ada dan data sudah di-delete, sistem akan restore data tersebut dengan nama baru.

---

### Update Item Category

```
PUT /api/master/item-category/:itemCategoryId
```

**Body:** Same as Create

---

### Delete Item Category

```
DELETE /api/master/item-category/:itemCategoryId
```

> **Note:** Uses soft delete (`deletedAt` field)

---

## Validation Schema

```typescript
const ItemCategoryBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});
```

---

## Business Rules

- `code` harus unique di antara data yang tidak di-delete
- `code` otomatis di-uppercase
- Jika POST dengan code yang sudah ada (soft deleted), data akan di-restore
- Soft delete dengan `deletedAt`

---

## Database Model

```prisma
model MasterItemCategory {
  id        Int       @id @default(autoincrement())
  code      String    // ex: DET
  name      String    // ex: Detergen
  items     MasterItem[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("categories")
}
```
