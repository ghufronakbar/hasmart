# Unit Module

Module untuk mengelola master unit (MasterUnit) sebagai autocomplete di item variant.

---

## Overview

Module ini menyediakan CRUD operations untuk entity `MasterUnit` yang digunakan sebagai referensi unit di item variant.

---

## Files

| File                 | Description                          |
| -------------------- | ------------------------------------ |
| `unit.controller.ts` | HTTP request/response handlers       |
| `unit.service.ts`    | Business logic & database operations |
| `unit.route.ts`      | Route definitions                    |
| `unit.validator.ts`  | Zod validation schemas               |

---

## Dependency

- `common/prisma` - Database access
- `common/jwt` - Auth middleware

---

## API Endpoints

### List Units

```
GET /api/master/unit
Authorization: Bearer <token>
```

**Query Parameters:** `search`, `page`, `limit`, `sort`, `sortBy`

---

### Get Unit by ID

```
GET /api/master/unit/:unitId
Authorization: Bearer <token>
```

---

### Create Unit

```
POST /api/master/unit
Authorization: Bearer <token>
```

**Body:**

```json
{
  "unit": "PCS",
  "name": "Piece"
}
```

---

### Update Unit

```
PUT /api/master/unit/:unitId
Authorization: Bearer <token>
```

---

### Delete Unit

```
DELETE /api/master/unit/:unitId
Authorization: Bearer <token>
```

---

## Validation Schema

```typescript
const UnitBodySchema = z.object({
  unit: z.string().min(1),
  name: z.string().min(1),
});
```

---

## Business Rules

- `unit` harus unique (di antara yang tidak di-delete)
- `unit` otomatis uppercase
- Jika POST dengan unit yang sudah di-soft-delete, akan restore
- Soft delete dengan `deletedAt`
