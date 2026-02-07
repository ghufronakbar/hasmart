# Member Category Module

Module untuk mengelola kategori member (MasterMemberCategory).

---

## Overview

Module ini menyediakan CRUD operations untuk entity `MasterMemberCategory` dengan count member aktif di setiap response.

---

## Files

| File                            | Description                          |
| ------------------------------- | ------------------------------------ |
| `member-category.controller.ts` | HTTP request/response handlers       |
| `member-category.service.ts`    | Business logic & database operations |
| `member-category.route.ts`      | Route definitions                    |
| `member-category.validator.ts`  | Zod validation schemas               |
| `member-category.interface.ts`  | Response type interfaces             |

---

## Dependency

- `common/prisma` - Database access
- `common/jwt` - Auth middleware

---

## API Endpoints

### List Member Categories

```
GET /api/master/member-category
Authorization: Bearer <token>
```

**Response includes:** `memberCount` (jumlah member aktif)

---

### Get by ID

```
GET /api/master/member-category/:memberCategoryId
Authorization: Bearer <token>
```

---

### Get by Code

```
GET /api/master/member-category/:code/code
Authorization: Bearer <token>
```

---

### Create

```
POST /api/master/member-category
Authorization: Bearer <token>
```

**Body:**

```json
{
  "code": "VIP",
  "name": "VIP Member",
  "color": "FFD700"
}
```

---

### Update

```
PUT /api/master/member-category/:memberCategoryId
Authorization: Bearer <token>
```

---

### Delete

```
DELETE /api/master/member-category/:memberCategoryId
Authorization: Bearer <token>
```

---

## Validation Schema

```typescript
const MemberCategoryBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  color: z
    .string()
    .length(6)
    .regex(/^[0-9A-Fa-f]{6}$/),
});
```

---

## Business Rules

- `code` harus unique dan uppercase
- `color` harus valid hex (6 karakter)
- Response selalu include `memberCount`
- Soft delete dengan `deletedAt`
