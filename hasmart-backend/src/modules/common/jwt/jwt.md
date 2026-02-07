# JWT Module

Common module yang menyediakan JWT signing dan verification menggunakan jose.

---

## Overview

Module ini menyediakan service untuk membuat dan memverifikasi JWT token menggunakan library `jose`. Token tidak memiliki expiry time sesuai requirement.

---

## Files

| File             | Description                        |
| ---------------- | ---------------------------------- |
| `jwt.service.ts` | JWT signing & verification service |

---

## Dependency

- `jose` - Library untuk JWT handling
- `src/config` - Untuk mengambil JWT_SECRET

---

## Environment Variables

Tambahkan ke `.env`:

```env
JWT_SECRET=your-secret-key-minimum-32-characters
```

---

## Usage

### 1. Import di bootstrap.ts

```typescript
import { JwtService } from "./modules/common/jwt/jwt.service";

const jwtService = new JwtService(cfg);
```

### 2. Inject ke Service

```typescript
export class UserService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {
    super();
  }

  async login(name: string, password: string) {
    const user = await this.findUser(name);
    // ... verify password
    const token = await this.jwt.sign({ userId: user.id, name: user.name });
    return { token };
  }
}
```

---

## API

### Type: `JwtPayload`

```typescript
type JwtPayload = {
  userId: number;
  name: string;
};
```

### Class: `JwtService`

| Method          | Params       | Return                        | Description                                |
| --------------- | ------------ | ----------------------------- | ------------------------------------------ |
| `sign(payload)` | `JwtPayload` | `Promise<string>`             | Buat JWT token                             |
| `verify(token)` | `string`     | `Promise<JwtPayload \| null>` | Verifikasi token, return null jika invalid |
