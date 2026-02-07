# Prisma Module

Common module yang menyediakan Prisma client sebagai shared service.

---

## Overview

Module ini adalah **common service** yang menyediakan instance Prisma Client untuk digunakan oleh semua module lain. Menggunakan pattern Dependency Injection.

---

## Files

| File                | Description                 |
| ------------------- | --------------------------- |
| `prisma.service.ts` | Prisma Client wrapper class |

---

## Usage

### 1. Import di bootstrap.ts

```typescript
import { PrismaService } from "./modules/common/prisma/prisma.service";

const prismaService = new PrismaService();
```

### 2. Inject ke Service

```typescript
export class BranchService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  getAll = async () => {
    return await this.prisma.branch.findMany();
  };
}
```

---

## API

### Class: `PrismaService`

Extends `PrismaClient` dari `@prisma/client`.

```typescript
class PrismaService extends PrismaClient {
  constructor();
  async connect(): Promise<void>;
}
```

**Methods:**

| Method           | Description                          |
| ---------------- | ------------------------------------ |
| `connect()`      | Establish database connection        |
| `$connect()`     | (inherited) Connect to database      |
| `$disconnect()`  | (inherited) Disconnect from database |
| `$transaction()` | (inherited) Execute transaction      |

---

## Configuration

Database connection dikonfigurasi via environment variables:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"
```

Lihat `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## Best Practices

1. **Single Instance** - Gunakan satu instance PrismaService yang di-share
2. **DI Pattern** - Inject via constructor, bukan global import
3. **Transactions** - Gunakan `prisma.$transaction()` untuk operasi atomic
4. **Soft Delete** - Selalu filter `deletedAt: null` untuk query
