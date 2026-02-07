# Password Module

Common module yang menyediakan password hashing menggunakan bcryptjs.

---

## Overview

Module ini menyediakan service untuk hashing dan verifikasi password menggunakan bcryptjs dengan salt rounds 10.

---

## Files

| File                  | Description              |
| --------------------- | ------------------------ |
| `password.service.ts` | Password hashing service |

---

## Dependency

- `bcryptjs` - Library untuk password hashing

---

## Usage

### 1. Import di bootstrap.ts

```typescript
import { PasswordService } from "./modules/common/password/password.service";

const passwordService = new PasswordService();
```

### 2. Inject ke Service

```typescript
export class UserService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
  ) {
    super();
  }

  async createUser(data: CreateUserDto) {
    const hashedPassword = await this.password.hash(data.password);
    // ...
  }

  async verifyPassword(password: string, hash: string) {
    return await this.password.verify(password, hash);
  }
}
```

---

## API

### Class: `PasswordService`

| Method                   | Params           | Return             | Description                 |
| ------------------------ | ---------------- | ------------------ | --------------------------- |
| `hash(password)`         | `string`         | `Promise<string>`  | Hash password dengan bcrypt |
| `verify(password, hash)` | `string, string` | `Promise<boolean>` | Verifikasi password         |
