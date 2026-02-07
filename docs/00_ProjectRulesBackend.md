# Backend Project Rules

Dokumentasi lengkap untuk pengembangan backend hasmart menggunakan Express.js dan TypeScript.

---

## Tech Stack

| Technology | Version  | Purpose       |
| ---------- | -------- | ------------- |
| Node.js    | -        | Runtime       |
| Express.js | ^4.21.2  | Web Framework |
| TypeScript | ^5.8.3   | Type Safety   |
| Prisma     | ^5.22.0  | ORM           |
| Zod        | ^3.25.67 | Validation    |
| PostgreSQL | -        | Database      |

---

## Project Structure

```
hasmart-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── base/                  # Base classes
│   │   ├── base-controller.ts
│   │   ├── base-service.ts
│   │   └── base-router.ts
│   ├── config/                # Configuration
│   │   └── index.ts
│   ├── middleware/            # Express middleware
│   │   ├── error-handler.ts
│   │   ├── validate-handler.ts
│   │   └── use-filter.ts
│   ├── modules/               # Feature modules
│   │   ├── app/               # Application modules
│   │   ├── common/            # Shared services
│   │   ├── master/            # Master data modules
│   │   └── transaction/       # Transaction modules
│   ├── utils/                 # Utilities
│   │   └── error.ts
│   ├── bootstrap.ts           # DI & route registration
│   └── index.ts               # Entry point
├── templates/                 # Module generator templates
├── scripts/                   # Build/generator scripts
└── package.json
```

---

## Module Architecture

### Module Prefixes

Modules diorganisasi dalam folder prefix berdasarkan domain:

| Prefix         | Deskripsi           | Contoh         |
| -------------- | ------------------- | -------------- |
| `app/`         | Pengaturan aplikasi | branch         |
| `common/`      | Shared services     | prisma         |
| `master/`      | Master data         | item, supplier |
| `transaction/` | Transaksi           | purchase, sale |

### Module Types

#### 1. Business Module (Full)

Module dengan business logic lengkap. Contoh: `app/branch`

```
modules/{prefix}/{module-name}/
├── {module}.controller.ts   # Handle HTTP request/response
├── {module}.service.ts      # Business logic
├── {module}.route.ts        # Route definitions
├── {module}.validator.ts    # Zod schemas
├── {module}.interface.ts    # Response interfaces (optional)
└── {module}.md              # Documentation
```

> **Note:** File `{module}.interface.ts` digunakan untuk mendefinisikan response type yang konsisten. Gunakan jika module memiliki response yang kompleks atau perlu konsistensi key.

#### 2. Common Module (Service Only)

Module yang menyediakan shared service. Contoh: `common/prisma`

```
modules/common/{module-name}/
├── {module}.service.ts      # Service implementation
└── {module}.md              # Documentation
```

---

## File Conventions

### Controller (`*.controller.ts`)

```typescript
import { BaseController } from "../../../base/base-controller";
import { {Module}Service } from "./{module}.service";
import { Request, Response } from "express";

export class {Module}Controller extends BaseController {
  constructor(private service: {Module}Service) {
    super();
  }

  getAll = async (req: Request, res: Response) => {
    const filter = req.filterQuery;
    const { rows, pagination } = await this.service.getAll(filter);
    return this.sendList(req, res, rows, pagination, filter);
  };

  getById = async (req: Request, res: Response) => {
    const params = req.params as unknown as {Module}ParamsType;
    const data = await this.service.getById(params.id);
    return this.sendOk(req, res, data);
  };

  create = async (req: Request, res: Response) => {
    const data = req.body as {Module}BodyType;
    const result = await this.service.create(data);
    return this.sendOk(req, res, result);
  };

  update = async (req: Request, res: Response) => {
    const params = req.params as unknown as {Module}ParamsType;
    const data = req.body as {Module}BodyType;
    const result = await this.service.update(params.id, data);
    return this.sendOk(req, res, result);
  };

  delete = async (req: Request, res: Response) => {
    const params = req.params as unknown as {Module}ParamsType;
    const result = await this.service.delete(params.id);
    return this.sendOk(req, res, result);
  };
}
```

**Response Methods:**

- `sendOk(req, res, data)` - 200 OK dengan data
- `sendList(req, res, data, pagination, filter)` - 200 OK dengan list + pagination
- `sendBadRequest(req, res, data)` - 400 Bad Request
- `sendNotFound(req, res, data)` - 404 Not Found

### Service (`*.service.ts`)

```typescript
import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { {Module}BodyType } from "./{module}.validator";
import { NotFoundError, BadRequestError } from "../../../utils/error";
import { FilterQueryType } from "../../../middleware/use-filter";
import { Prisma } from ".prisma/client";

export class {Module}Service extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private constructWhere(filter?: FilterQueryType): Prisma.{Model}WhereInput {
    return {
      deletedAt: null,
      OR: filter?.search
        ? [
            { name: { contains: filter.search, mode: "insensitive" } },
            // ... searchable fields
          ]
        : undefined,
    };
  }

  private constructArgs(filter?: FilterQueryType): Prisma.{Model}FindManyArgs {
    return {
      where: this.constructWhere(filter),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: filter?.sortBy
        ? { [filter.sortBy]: filter.sort }
        : undefined,
    };
  }

  getAll = async (filter?: FilterQueryType) => {
    const [rows, count] = await Promise.all([
      this.prisma.{model}.findMany(this.constructArgs(filter)),
      this.prisma.{model}.count({ where: this.constructWhere(filter) }),
    ]);

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });

    return { rows, pagination };
  };

  getById = async (id: number) => {
    const data = await this.prisma.{model}.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) throw new NotFoundError();
    return data;
  };

  create = async (data: {Module}BodyType) => {
    return await this.prisma.{model}.create({ data });
  };

  update = async (id: number, data: {Module}BodyType) => {
    return await this.prisma.{model}.update({
      where: { id },
      data,
    });
  };

  delete = async (id: number) => {
    const data = await this.prisma.{model}.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) throw new NotFoundError();

    return await this.prisma.{model}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  };
}
```

### Router (`*.route.ts`)

```typescript
import { BaseRouter } from "../../../base/base-router";
import { {Module}Controller } from "./{module}.controller";
import { asyncHandler } from "../../../middleware/error-handler";
import { validateHandler } from "../../../middleware/validate-handler";
import { useFilter } from "../../../middleware/use-filter";
import { {Module}BodySchema, {Module}ParamsSchema } from "./{module}.validator";

export class {Module}Router extends BaseRouter {
  constructor(private controller: {Module}Controller) {
    super();
    this.registerRoutes();
  }

  private registerRoutes() {
    // GET all with filter
    this.router.get(
      "/",
      useFilter(),
      asyncHandler(async (req, res) => await this.controller.getAll(req, res))
    );

    // GET by ID
    this.router.get(
      "/:id",
      validateHandler({ params: {Module}ParamsSchema }),
      asyncHandler(async (req, res) => await this.controller.getById(req, res))
    );

    // POST create
    this.router.post(
      "/",
      validateHandler({ body: {Module}BodySchema }),
      asyncHandler(async (req, res) => await this.controller.create(req, res))
    );

    // PUT update
    this.router.put(
      "/:id",
      validateHandler({ params: {Module}ParamsSchema, body: {Module}BodySchema }),
      asyncHandler(async (req, res) => await this.controller.update(req, res))
    );

    // DELETE
    this.router.delete(
      "/:id",
      validateHandler({ params: {Module}ParamsSchema }),
      asyncHandler(async (req, res) => await this.controller.delete(req, res))
    );
  }
}
```

### Validator (`*.validator.ts`)

```typescript
import { z } from "zod";

export const {Module}BodySchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  // ... fields
});

export type {Module}BodyType = z.infer<typeof {Module}BodySchema>;

export const {Module}ParamsSchema = z.object({
  id: z.coerce.number(),
});

export type {Module}ParamsType = z.infer<typeof {Module}ParamsSchema>;
```

---

## Registering Module

### 1. Import di `bootstrap.ts`

```typescript
// Import module components
import { {Module}Router } from "./modules/{prefix}/{module}/{module}.route";
import { {Module}Controller } from "./modules/{prefix}/{module}/{module}.controller";
import { {Module}Service } from "./modules/{prefix}/{module}/{module}.service";

// Initialize service
const {module}Service = new {Module}Service(prismaService);

// Initialize controller
const {module}Controller = new {Module}Controller({module}Service);

// Initialize router
const {module}Router = new {Module}Router({module}Controller);

// Register route
api.use("/{prefix}/{module}", {module}Router.router);
```

### 2. Route Path Convention

Routes terdaftar di `/api/{prefix}/{module}`:

- `GET /api/app/branch` → List branches
- `GET /api/app/branch/:branchId` → Get branch by ID
- `POST /api/app/branch` → Create branch
- `PUT /api/app/branch/:branchId` → Update branch
- `DELETE /api/app/branch/:branchId` → Delete branch

---

## Error Handling

### Available Error Classes

```typescript
import {
  BadRequestError, // 400
  UnauthorizedError, // 401
  ForbiddenError, // 403
  NotFoundError, // 404
  ConflictError, // 409
  UnprocessableEntityError, // 422
  TooManyRequestsError, // 429
  InternalServerError, // 500
  ValidationError, // 422
} from "../../../utils/error";
```

### Usage

```typescript
// Throw error in service
if (!data) throw new NotFoundError();
if (duplicate) throw new BadRequestError("Kode sudah ada");
```

### Response Format

```json
{
  "metaData": {
    "code": 404,
    "timestamp": "2026-01-27T10:00:00.000Z",
    "status": "NOT_FOUND"
  },
  "data": null,
  "errors": {
    "message": "Not found",
    "details": null
  }
}
```

---

## Filter & Pagination

### Query Parameters

| Parameter   | Type            | Default | Description          |
| ----------- | --------------- | ------- | -------------------- |
| `search`    | string          | ""      | Search across fields |
| `page`      | number          | 1       | Current page         |
| `limit`     | number          | 10      | Items per page       |
| `sort`      | "asc" \| "desc" | "desc"  | Sort direction       |
| `sortBy`    | string          | "id"    | Sort column          |
| `dateStart` | Date            | -       | Filter from date     |
| `dateEnd`   | Date            | -       | Filter to date       |
| `category`  | string          | ""      | Category filter      |

### Response with Pagination

```json
{
  "metaData": {
    "code": 200,
    "timestamp": "2026-01-27T10:00:00.000Z",
    "status": "OK"
  },
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filterQuery": {
    "search": "",
    "page": 1,
    "limit": 10,
    "sort": "desc",
    "sortBy": "id"
  }
}
```

---

## Soft Delete Pattern

Semua entity menggunakan soft delete dengan field `deletedAt`:

```typescript
// Query active records only
where: { deletedAt: null }

// Soft delete
await this.prisma.{model}.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

---

## Module Generator

### Installation

Pastikan `mustache` terinstall:

```bash
cd hasmart-backend
npm install mustache --save-dev
```

### Usage

Generate module baru:

```bash
npm run gen:module -- --name <module-name> --prefix <prefix>
```

**Examples:**

```bash
# Generate app module
npm run gen:module -- --name supplier --prefix master

# Generate common module (service only)
npm run gen:module -- --name cache --prefix common
```

### Generated Files

Untuk business module (`app/`, `master/`, `transaction/`):

```
src/modules/{prefix}/{name}/
├── {name}.controller.ts
├── {name}.service.ts
├── {name}.route.ts
├── {name}.validator.ts
└── {name}.md
```

Untuk common module:

```
src/modules/common/{name}/
├── {name}.service.ts
└── {name}.md
```

### Post-Generation Steps

1. Update Prisma schema jika perlu
2. Register module di `bootstrap.ts`
3. Customize generated code sesuai kebutuhan
4. Update documentation di `{module}.md`

---

## Coding Conventions

### Naming

| Type     | Convention      | Example                |
| -------- | --------------- | ---------------------- |
| File     | kebab-case      | `branch.controller.ts` |
| Class    | PascalCase      | `BranchController`     |
| Method   | camelCase       | `getAllBranches`       |
| Variable | camelCase       | `branchService`        |
| Constant | SCREAMING_SNAKE | `MAX_LIMIT`            |

### TypeScript

- Gunakan `strict: true` di tsconfig
- Explicit return types untuk public methods
- Avoid `any`, gunakan proper typing
- Use `z.infer<typeof Schema>` untuk type dari Zod

### Imports

Urutan import:

1. External packages
2. Internal modules (base, utils)
3. Relative imports (same module)

```typescript
// External
import { z } from "zod";
import { Request, Response } from "express";

// Internal
import { BaseController } from "../../../base/base-controller";
import { NotFoundError } from "../../../utils/error";

// Relative
import { BranchService } from "./branch.service";
import { BranchBodyType } from "./branch.validator";
```

### Todo Notes

- Gunakan komentar dengan format "// TODO: <note>" untuk memberikan catatan

---

## Interface Files

Untuk module yang memiliki response kompleks atau memerlukan konsistensi key, buat file `{module}.interface.ts`:

```typescript
// item.interface.ts
export interface ItemResponse {
  id: number;
  name: string;
  stock: number; // ← Key yang sama, value berbeda berdasarkan context
  // ...
}
```

### Consistent Response Keys

Pastikan response key selalu sama meskipun logic berbeda. Contoh:

```typescript
// ❌ SALAH - Key berbeda untuk kondisi berbeda
return branchId
  ? { itemBranchStock: branchStock }
  : { recordedGlobalStock: globalStock };

// ✅ BENAR - Key sama, value berbeda
return { stock: branchId ? branchStock : globalStock };
```
