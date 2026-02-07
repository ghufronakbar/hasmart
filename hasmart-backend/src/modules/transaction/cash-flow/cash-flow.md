# Transaction Cash Flow Module

Module untuk mengelola arus kas masuk dan keluar (Petty Cash, Donasi, dll) tanpa mempengaruhi stok barang.

---

## Files

| File                      | Description                          |
| ------------------------- | ------------------------------------ |
| `cash-flow.controller.ts` | HTTP request/response handlers       |
| `cash-flow.service.ts`    | Business logic & database operations |
| `cash-flow.route.ts`      | Route definitions                    |
| `cash-flow.validator.ts`  | Zod validation schemas               |

---

## API Endpoints

### Get All Cash Flows

Mengambil daftar transaksi cash flow dengan filter dan pagination.

**Endpoint:**

```
GET /api/transaction/cash-flow
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branchId` | number | No | ID Cabang |
| `search` | string | No | Pencarian pada notes |
| `dateStart` | date | No | Filter tanggal awal |
| `dateEnd` | date | No | Filter tanggal akhir |
| `page` | number | No | Halaman (default: 1) |
| `limit` | number | No | Jumlah per halaman (default: 10) |
| `sortBy` | string | No | Field untuk sorting |
| `sort` | asc/desc | No | Arah sorting |

---

### Get Cash Flow Detail

Mengambil detail transaksi cash flow berdasarkan ID.

**Endpoint:**

```
GET /api/transaction/cash-flow/:id
```

---

### Create Cash Flow

Membuat transaksi cash flow baru.

**Endpoint:**

```
POST /api/transaction/cash-flow
```

**Request Body:**

```json
{
  "branchId": 1,
  "notes": "Beli galon",
  "amount": 20000,
  "type": "OUT",
  "transactionDate": "2023-10-27T00:00:00.000Z"
}
```

---

### Update Cash Flow

Mengubah data transaksi cash flow.

**Endpoint:**

```
PUT /api/transaction/cash-flow/:id
```

**Request Body:**

```json
{
  "branchId": 1,
  "notes": "Beli galon aqua",
  "amount": 22000,
  "type": "OUT",
  "transactionDate": "2023-10-27T00:00:00.000Z"
}
```

---

### Delete Cash Flow

Menghapus (soft delete) transaksi cash flow.

**Endpoint:**

```
DELETE /api/transaction/cash-flow/:id
```

---

## Validation Schema

### CashFlowBodySchema

```typescript
{
  branchId: number;
  notes: string;
  amount: number; // harus positif
  type: "IN" | "OUT";
  transactionDate: Date;
}
```
