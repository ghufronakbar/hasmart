# Backend Decimal Migration Guide

**Context:** Migrasi sistem akuntansi POS/ERP dari tipe data `Int/Float` ke `Decimal` untuk menjamin presisi keuangan.
**Target Stack:** Node.js, TypeScript, Prisma (PostgreSQL), Zod.

---

## PART 1: User Story

### Description

Sebagai **Backend Developer**, saya ingin mengubah seluruh tipe data finansial (Uang & Persentase) dari `Int` (Number) menjadi `Decimal` (Object/String) pada layer aplikasi backend.
Hal ini bertujuan untuk:

1.  Menghindari error _floating-point arithmetic_ JavaScript (contoh: `0.1 + 0.2 != 0.3`).
2.  Mendukung nilai transaksi yang sangat besar (hingga Kuadriliun).
3.  Menjaga presisi 2 angka di belakang koma secara konsisten.

### Scope of Work

1.  **Validators (Zod):** Mengubah validasi input agar menerima String/Number dan mentransformasi menjadi `Decimal Object`.
2.  **Service Logic:** Mengganti semua operator matematika native (`+`, `-`, `*`, `/`) dengan method library Decimal.
3.  **Interfaces (Response DTO):** Mengubah tipe data output finansial menjadi `string` untuk keamanan konsumsi Frontend.

### Acceptance Criteria

- [ ] Field Uang (Price, Amount) dan Persentase diproses sebagai `Decimal`.
- [ ] Field Kuantitas (Qty, Stock) **tetap** sebagai `number` (Integer).
- [ ] Tidak ada error tipe data saat menjalankan `npm run build`.
- [ ] Dokumentasi modul (ex: `item.md`) diperbarui setelah refactoring.

---

## PART 2: AI Agent Rules & Technical Specs

Instruksi ini **WAJIB** diikuti oleh AI Agent saat melakukan refactoring code.

### 1. Imports

Gunakan library Decimal bawaan Prisma Client. Jangan install library `decimal.js` terpisah kecuali terpaksa.

```typescript
import { Decimal } from "@prisma/client/runtime/library";
```

### 2. Refactoring Patterns

#### A. Validators (`*.validator.ts`)

Input dari Frontend/API bisa berupa `number` atau `string`. Namun, Zod harus mengubahnya menjadi `Decimal` instance sebelum masuk ke Service.

**Pattern:**

```typescript
// Helper Schema (Bisa ditaruh di utils atau inline)
const decimalSchema = z
  .union([z.string(), z.number()])
  .transform((val) => new Decimal(val));

// Usage in Schema
export const ItemBodySchema = z.object({
  name: z.string(),
  qty: z.number().int(), // QTY TETAP NUMBER

  // MONEY & PERCENTAGE JADI DECIMAL
  sellPrice: decimalSchema,
  taxPercentage: decimalSchema,
});
```

#### B. Interfaces / DTO (`*.interface.ts`)

Response ke luar (Frontend) **HARUS String** untuk menjaga presisi desimal (menghindari JSON number truncation).

**Pattern:**

```typescript
export interface ItemResponse {
  id: number;
  name: string;
  stock: number; // Qty tetap number

  // MONEY & PERCENTAGE JADI STRING
  sellPrice: string; // ex: "15000.00"
  profitPercentage: string; // ex: "12.50"
}
```

#### C. Service Logic (`*.service.ts`)

**STRICT RULE:** Dilarang menggunakan operator `+`, `-`, `*`, `/` pada variabel bertipe Decimal.

**Pattern:**

```typescript
// 1. Kalkulasi
// const profit = sellPrice - buyPrice; // <--- FORBIDDEN / ERROR
const profit = sellPrice.sub(buyPrice); // <--- CORRECT

// const total = price * qty; // <--- FORBIDDEN
const total = price.mul(qty); // <--- CORRECT (Decimal * Number is OK in Prisma Decimal)

// 2. Mapping Response
return {
  ...item,
  // Selalu format ke 2 desimal saat return ke interface
  sellPrice: item.sellPrice.toFixed(2),
  profitPercentage: item.recordedProfitPercentage.toFixed(2),
};
```

### 3. Special Case: Aggregates

Jika menggunakan `prisma.aggregate`, nilai kembalian bisa `null`. Handle dengan default value.

```typescript
const agg = await prisma.transaction.aggregate({ _sum: { total: true } });
const total = agg._sum.total ?? new Decimal(0);
```

---

## PART 3: Execution Workflow (For AI Agent)

Ikuti langkah ini saat merefactor modul (contoh: Module Master Item):

1. **Analyze:** Baca file `.validator.ts`, `.interface.ts`, dan `.service.ts`. Identifikasi field mana yang merupakan Uang/Persen dan mana yang Qty/Integer.
2. **Refactor Validator:** Ubah Zod schema untuk field uang menjadi transform Decimal.
3. **Refactor Interface:** Ubah tipe field uang menjadi `string`.
4. **Refactor Service:**

- Perbaiki error TypeScript akibat perubahan tipe di Interface.
- Ganti logika matematika dengan method `.mul()`, `.add()`, `.sub()`, `.div()`.
- Gunakan `.toFixed(2)` saat mapping data ke response object.

5. **Verification Reminder:** Di akhir respon, ingatkan user untuk:

- Menjalankan `npm run build` untuk cek type safety.
- Mengupdate dokumentasi `.md` terkait (misal: `docs/modules/master/item.md`) karena struktur JSON response berubah dari number ke string.

---

## Reference: Field Mapping (Example)

| Field Name                      | Old Type (TS) | New Type (TS Validator)        | New Type (TS Interface) |
| ------------------------------- | ------------- | ------------------------------ | ----------------------- |
| `qty`, `stock`, `amount` (Unit) | `number`      | `z.number().int()`             | `number`                |
| `sellPrice`, `buyPrice`         | `number`      | `z...transform(new Decimal())` | `string`                |
| `profitPercentage`, `tax`       | `number`      | `z...transform(new Decimal())` | `string`                |
| `totalAmount`, `subTotal`       | `number`      | `z...transform(new Decimal())` | `string`                |
