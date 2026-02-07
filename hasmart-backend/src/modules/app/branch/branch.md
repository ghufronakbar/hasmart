# Branch Module

Module untuk mengelola data cabang (branch) dalam aplikasi.

---

## Overview

Module ini menyediakan CRUD operations untuk entity `Branch` yang merepresentasikan cabang toko/outlet.

---

## Files

| File                   | Description                          |
| ---------------------- | ------------------------------------ |
| `branch.controller.ts` | HTTP request/response handlers       |
| `branch.service.ts`    | Business logic & database operations |
| `branch.route.ts`      | Route definitions                    |
| `brach.validator.ts`   | Zod validation schemas               |

---

## API Endpoints

### List Branches

```
GET /api/app/branch
```

**Query Parameters:**

- `search` - Search by name, code, address, phone, email, fax, npwp, ownerName
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort direction: asc/desc (default: desc)
- `sortBy` - Sort column (default: id)

---

### Get Branch by ID

```
GET /api/app/branch/:branchId
```

**Params:**

- `branchId` - Branch ID (number)

---

### Create Branch

```
POST /api/app/branch
```

**Body:**

```json
{
  "code": "CGK",
  "name": "Cabang Jakarta",
  "address": "Jl. Contoh No. 1",
  "phone": "021-1234567",
  "email": "jakarta@store.com",
  "fax": "021-1234568",
  "npwp": "12.345.678.9-012.000",
  "ownerName": "Budi Santoso",
  "receiptSize": "58mm",
  "receiptFooter": "Terima kasih",
  "receiptPrinter": "EPSON TM-T82",
  "labelBarcodePrinter": "ZEBRA ZD220",
  "reportPrinter": "HP LaserJet"
}
```

---

### Update Branch

```
PUT /api/app/branch/:branchId
```

**Params:**

- `branchId` - Branch ID (number)

**Body:** Same as Create

---

### Delete Branch

```
DELETE /api/app/branch/:branchId
```

**Params:**

- `branchId` - Branch ID (number)

> **Note:** Uses soft delete (`deletedAt` field)

---

## Validation Schema

```typescript
const BranchBodySchema = z.object({
  code: z.string(),
  name: z.string(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  fax: z.string().optional().nullable(),
  npwp: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  receiptSize: z.string().optional().nullable(),
  receiptFooter: z.string().optional().nullable(),
  receiptPrinter: z.string().optional().nullable(),
  labelBarcodePrinter: z.string().optional().nullable(),
  reportPrinter: z.string().optional().nullable(),
});
```

---

## Business Rules

- `code` harus unique (uppercase)
- Soft delete dengan `deletedAt`
- Setiap branch memiliki:
  - Stok sendiri (`ItemBranch`)
  - Transaksi sendiri (`TransactionPurchase`)

---

## Database Model

Lihat `prisma/schema.prisma` untuk model `Branch`.
