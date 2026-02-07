# Supplier Module

Module untuk mengelola data supplier (MasterSupplier).

---

## Overview

Module ini menyediakan CRUD operations untuk entity `MasterSupplier`.

---

## Files

| File                     | Description                          |
| ------------------------ | ------------------------------------ |
| `supplier.controller.ts` | HTTP request/response handlers       |
| `supplier.service.ts`    | Business logic & database operations |
| `supplier.route.ts`      | Route definitions                    |
| `supplier.validator.ts`  | Zod validation schemas               |

---

## Dependency

- `common/prisma` - Database access
- `common/jwt` - Auth middleware

---

## API Endpoints

### List Suppliers

```
GET /api/master/supplier
Authorization: Bearer <token>
```

**Query Parameters:** `search`, `page`, `limit`, `sort`, `sortBy`

---

### Get Supplier by ID

```
GET /api/master/supplier/:supplierId
Authorization: Bearer <token>
```

---

### Create Supplier

```
POST /api/master/supplier
Authorization: Bearer <token>
```

**Body:**

```json
{
  "code": "MYR",
  "name": "Mayora",
  "phone": "021-1234567",
  "address": "Jl. Industri No. 1",
  "email": "info@mayora.com"
}
```

---

### Update Supplier

```
PUT /api/master/supplier/:supplierId
Authorization: Bearer <token>
```

---

### Delete Supplier

```
DELETE /api/master/supplier/:supplierId
Authorization: Bearer <token>
```

---

## Validation Schema

```typescript
const SupplierBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});
```

---

## Business Rules

- `code` harus unique (di antara yang tidak di-delete)
- `code` otomatis uppercase
- Jika POST dengan code yang sudah di-soft-delete, akan restore
- Soft delete dengan `deletedAt`
