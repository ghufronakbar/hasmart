# User Module

Module untuk autentikasi dan manajemen user.

---

## Overview

Module ini menyediakan endpoint untuk first-time setup, login, dan manajemen user dengan JWT authentication.

---

## Files

| File                 | Description                          |
| -------------------- | ------------------------------------ |
| `user.controller.ts` | HTTP request/response handlers       |
| `user.service.ts`    | Business logic & database operations |
| `user.route.ts`      | Route definitions                    |
| `user.validator.ts`  | Zod validation schemas               |

---

## Dependency

- `common/prisma` - Database access
- `common/password` - Password hashing (bcryptjs)
- `common/jwt` - JWT signing/verification (jose)

---

## API Endpoints

### Check Status

```
GET /api/app/user/status
```

**Response:**

```json
{
  "hasUsers": false,
  "userCount": 0
}
```

---

### First Time Setup

```
POST /api/app/user/first-time-setup
```

**Body:**

```json
{
  "name": "admin",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "name": "admin",
    "isActive": true,
    "isSuperUser": true
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

> **Note:** Endpoint ini hanya bisa dipanggil jika belum ada user sama sekali.

---

### Login

```
POST /api/app/user/login
```

**Body:**

```json
{
  "name": "admin",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "name": "admin",
    "isActive": true,
    "isSuperUser": true
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### Refresh Token

```

POST /api/app/user/refresh

```

**Body:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response:**

```json
{
  "accessToken": "eyJ..."
}
```

---

### Get All Users (Protected)

```
GET /api/app/user
Authorization: Bearer <token>
```

**Response:**

```json
{
  "users": [
    {
      "id": 1,
      "name": "admin",
      "isActive": true,
      "isSuperUser": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

### Create User (Protected)

```
POST /api/app/user
Authorization: Bearer <token>
```

**Body:**

```json
{
  "name": "staff1",
  "password": "password123",
  "isActive": true
}
```

**Response:**

```json
{
  "id": 2,
  "name": "staff1",
  "isActive": true,
  "isSuperUser": false
}
```

> **TODO:** Endpoint ini sementara bisa diakses siapa saja yang memiliki token. Perlu ditambahkan authorization check.

---

### Who Am I (Protected)

```
GET /api/app/user/whoami
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": 1,
  "name": "admin",
  "isActive": true,
  "isSuperUser": true
}
```

---

### Edit Profile (Protected)

```
PUT /api/app/user
Authorization: Bearer <token>
```

**Body:**

```json
{
  "name": "admin baru"
}
```

**Response:**

```json
{
  "id": 1,
  "name": "admin baru",
  "isActive": true,
  "isSuperUser": true
}
```

---

### Change Password (Protected)

```
POST /api/app/user/change-password
Authorization: Bearer <token>
```

**Body:**

```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Response:**

```json
{
  "id": 1,
  "name": "admin baru",
  "isActive": true,
  "isSuperUser": true
}
```

---

### Delete User (Protected)

```
DELETE /api/app/user/:id
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": 2,
  "name": "staff1",
  "isActive": true,
  "isSuperUser": false
}
```

---

### Reset Password (Protected)

```
POST /api/app/user/:id/reset-password
Authorization: Bearer <token>
```

**Body:**

```json
{
  "newPassword": "newpassword123"
}
```

**Response:**

```json
{
  "id": 2,
  "name": "staff1",
  "isActive": true,
  "isSuperUser": false
}
```

---

## Validation Schemas

```typescript
const FirstTimeSetupBodySchema = z.object({
  name: z.string().min(3),
  password: z.string().min(6),
});

const LoginBodySchema = z.object({
  name: z.string(),
  password: z.string(),
});

const CreateUserBodySchema = z.object({
  name: z.string().min(3),
  password: z.string().min(6),
  isActive: z.boolean().default(true),
});

const EditProfileBodySchema = z.object({
  name: z.string().min(3),
});

const ChangePasswordBodySchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

const ResetPasswordBodySchema = z.object({
  newPassword: z.string().min(6),
});
```

---

## Business Rules

- First time setup hanya bisa dilakukan jika belum ada user
- User pertama otomatis menjadi superuser
- Username harus unique
- Password di-hash menggunakan bcryptjs
- Access token tidak memiliki expiry time
- Soft delete dengan `deletedAt`

---

## Database Model

Lihat `prisma/schema.prisma` untuk model `User`.

---

### Update User Access (Protected)

```
PUT /api/app/user/:id/access
Authorization: Bearer <token>
```

**Body:**

```json
{
  "accessOverviewRead": true,
  "accessPointOfSalesRead": true,
  ...
}
```

**Response:**

```json
{
  "id": 2,
  "name": "staff1",
  "isActive": true,
  "isSuperUser": false
}
```
