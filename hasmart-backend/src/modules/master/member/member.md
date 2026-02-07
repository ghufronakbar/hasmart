# Member Module

Module untuk mengelola data member (MasterMember).

---

## Overview

Module ini menyediakan CRUD operations untuk entity `MasterMember` dengan relasi ke kategori member.

---

## Files

| File                   | Description                          |
| ---------------------- | ------------------------------------ |
| `member.controller.ts` | HTTP request/response handlers       |
| `member.service.ts`    | Business logic & database operations |
| `member.route.ts`      | Route definitions                    |
| `member.validator.ts`  | Zod validation schemas               |

---

## Dependency

- `common/prisma` - Database access
- `common/jwt` - Auth middleware

---

## API Endpoints

### List Members

```
GET /api/master/member
Authorization: Bearer <token>
```

**Response includes:** `masterMemberCategory` object

---

### Get by ID

```
GET /api/master/member/:memberId
Authorization: Bearer <token>
```

---

### Get by Code

```
GET /api/master/member/:code/code
Authorization: Bearer <token>
```

---

### Create

```
POST /api/master/member
Authorization: Bearer <token>
```

**Body:**

```json
{
  "code": "6285123456789",
  "name": "Budi Santoso",
  "phone": "6285123456789",
  "email": "budi@example.com",
  "address": "Jl. Contoh No. 123",
  "masterMemberCategoryId": 1
}
```

---

### Update

```
PUT /api/master/member/:memberId
Authorization: Bearer <token>
```

---

### Delete

```
DELETE /api/master/member/:memberId
Authorization: Bearer <token>
```

---

## Validation Schema

```typescript
const MemberBodySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  masterMemberCategoryId: z.number().int().positive(),
});
```

---

## Business Rules

- `code` harus unique
- `masterMemberCategoryId` harus valid (tidak deleted)
- Response include `masterMemberCategory` object
- Soft delete dengan `deletedAt`
