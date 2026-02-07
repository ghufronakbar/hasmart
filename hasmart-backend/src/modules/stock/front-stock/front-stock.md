# FrontStock Module

Module untuk mengelola stok depan (Front Stock) dan perpindahan stok ke depan.

---

## Files

| File                        | Description                          |
| --------------------------- | ------------------------------------ |
| `front-stock.controller.ts` | HTTP request/response handlers       |
| `front-stock.service.ts`    | Business logic & database operations |
| `front-stock.route.ts`      | Route definitions                    |
| `front-stock.validator.ts`  | Zod validation schemas               |
| `front-stock.interface.ts`  | TypeScript interfaces for responses  |

---

## API Endpoints

### Get Item with Front Stock

Mengambil daftar item beserta jumlah stok depannya.

**Endpoint:**

```
GET /api/stock/front-stock/item
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branchId` | number | Yes | ID Cabang |
| `search` | string | No | Pencarian nama atau kode item |
| `page` | number | No | Halaman (default: 1) |
| `limit` | number | No | Jumlah per halaman (default: 10) |
| `sortBy` | string | No | Field untuk sorting |
| `sort` | asc/desc | No | Arah sorting |

### Response Example

```json
{
  "data": [
    {
      "id": 1,
      "name": "Indomie Goreng",
      "code": "IND001",
      "frontStock": 50,
      "variants": [
        {
          "id": 101,
          "name": "Pcs",
          "amount": 1,
          "price": 3000
        },
        {
          "id": 102,
          "name": "Dus",
          "amount": 40,
          "price": 115000
        }
      ]
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### List Front Stock Transfers (History)

Mengambil riwayat perpindahan stok ke depan.

**Endpoint:**

```
GET /api/stock/front-stock/transfer
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branchId` | number | Yes | ID Cabang |
| `search` | string | No | Pencarian pada notes |
| `page` | number | No | Halaman (default: 1) |
| `limit` | number | No | Jumlah per halaman (default: 10) |
| `sortBy` | string | No | Field untuk sorting |
| `sort` | asc/desc | No | Arah sorting |

---

### Create Front Stock Transfer

Membuat transaksi perpindahan stok ke depan (menambah/mengurangi stok depan tanpa mempengaruhi stok gudang utama).

**Endpoint:**

```
POST /api/stock/front-stock/transfer
```

**Request Body:**

```json
{
  "branchId": 1,
  "notes": "Restock rak depan",
  "items": [
    {
      "masterVariantId": 101,
      "transferAmount": 5
    },
    {
      "masterVariantId": 102,
      "transferAmount": -2
    }
  ]
}
```

---

### Delete/Void Front Stock Transfer

Menghapus (soft delete) transaksi front stock transfer dan mengembalikan saldo stok depan.

**Endpoint:**

```
DELETE /api/stock/front-stock/transfer/:frontStockTransferId
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `frontStockTransferId` | number | Yes | ID Transaksi Front Stock |

---

## Validation Schema

### FrontStockBodySchema

```typescript
{
  branchId: number;
  notes?: string;
  items: {
    masterVariantId: number;
    transferAmount: number; // Jumlah dalam satuan varian (bisa negatif)
  }[];
}
```

### FrontStockParamsSchema

```typescript
{
  branchId: number; // Coerced from string
}
```

### FrontStockTransferParamsSchema

```typescript
{
  frontStockTransferId: number; // Coerced from string
}
```
