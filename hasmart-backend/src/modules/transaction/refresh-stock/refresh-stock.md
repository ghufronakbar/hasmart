# RefreshStockService Documentation

## 1. Overview

**RefreshStockService** adalah service yang bertanggung jawab untuk menjaga konsistensi data stok (`ItemBranch.recordedStock`) dengan data historis transaksi.

Sistem ini menganut prinsip **Single Source of Truth** dari riwayat transaksi. Service ini tidak mengandalkan _increment/decrement_ sederhana, melainkan menghitung ulang total stok dari nol berdasarkan seluruh transaksi yang pernah terjadi untuk Item dan Cabang tertentu.

**Kapan service ini dipanggil?**
Service ini harus dieksekusi setiap kali ada proses `CREATE`, `UPDATE`, atau `DELETE` (Soft Delete) pada transaksi yang mempengaruhi stok (Pembelian, Penjualan, Retur, Transfer, Adjustment).

---

## 2. The Logic (Stock Formula)

Perhitungan stok dilakukan dengan melakukan agregasi data dari 9 tabel transaksi secara paralel. Hanya data yang **tidak terhapus** (`deletedAt: null`) yang akan dihitung.

### Rumus Perhitungan

$$
\text{Final Stock} = (\text{IN}) - (\text{OUT})
$$

Dimana komponennya adalah:

**Pemasukan (IN):**

1. `TransactionPurchase` (Pembelian dari Supplier)
2. `TransactionSalesReturn` (Retur Customer)
3. `TransactionTransfer` (Transfer Masuk / _To Branch_)
4. `TransactionAdjustment` (Penyesuaian Stok - jika nilai gap positif)
5. `TransactionSellReturn` (Retur Penjualan B2B)

**Pengeluaran (OUT):**

1. `TransactionSales` (Penjualan ke Customer)
2. `TransactionPurchaseReturn` (Retur ke Supplier)
3. `TransactionTransfer` (Transfer Keluar / _From Branch_)
4. `TransactionAdjustment` (Penyesuaian Stok - jika nilai gap negatif)
5. `TransactionSell` (Penjualan B2B)

---

## 3. Methods

### `refreshRealStock(branchId: number, masterItemId: number)`

Fungsi utama untuk melakukan rekalkulasi dan update database.

#### Parameters

| Parameter      | Type     | Description                                |
| :------------- | :------- | :----------------------------------------- |
| `branchId`     | `number` | ID Cabang tempat transaksi terjadi.        |
| `masterItemId` | `number` | ID Master Item yang akan dihitung stoknya. |

#### Returns

- **Type:** `Promise<ItemBranch>`
- Mengembalikan object `ItemBranch` yang sudah diperbarui dengan nilai `recordedStock` terbaru.

#### Process Flow

1.  **Parallel Aggregation:** Menjalankan `prisma.aggregate` ke 9 tabel terkait secara bersamaan menggunakan `Promise.all` untuk performa maksimal.
2.  **Filter `deletedAt`:**
    - Memastikan item transaksi tidak dihapus.
    - Memastikan parent transaksi (Invoice/Nota) tidak dihapus.
3.  **Calculation:** Menjumlahkan total `qty` (atau `totalGapAmount` untuk adjustment). Nilai `null` dari database dikonversi menjadi `0`.
4.  **Upsert:** Melakukan update ke tabel `item_branches`. Jika row belum ada (kasus edge case), sistem akan membuatnya otomatis.

---

## 4. Usage Example

Contoh penggunaan service ini di dalam Service Transaksi (misal: saat membuat Penjualan Baru).

```typescript
// transaction-sales.service.ts

export class TransactionSalesService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshStockService: RefreshStockService, // Inject Service
  ) {
    super();
  }

  async createSales(dto: CreateSalesDto) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create Sales Header & Items
      const newSales = await tx.transactionSales.create({
        data: {
          // ... data penjualan
          transactionSalesItems: {
            create: dto.items.map((item) => ({
              masterItemId: item.masterItemId,
              qty: item.qty,
              // ...
            })),
          },
        },
        include: { transactionSalesItems: true },
      });

      // 2. TRIGGER REFRESH STOCK (Post-Transaction Hook)
      // Loop unique items untuk refresh stok
      // Gunakan Promise.all agar tidak blocking berurutan
      const uniqueItems = [
        ...new Set(newSales.transactionSalesItems.map((i) => i.masterItemId)),
      ];

      await Promise.all(
        uniqueItems.map((itemId) =>
          this.refreshStockService.refreshRealStock(newSales.branchId, itemId),
        ),
      );

      return newSales;
    });
  }
}
```
