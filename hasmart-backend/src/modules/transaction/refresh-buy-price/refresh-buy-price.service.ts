import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";

export class RefreshBuyPriceService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Menghitung ulang harga beli (Average Cost)
   * Logika: Menggunakan "Weighted Average" (Rata-rata Tertimbang).
   * Jika ada Override Harga, maka perhitungan dimulai dari titik override tersebut.
   */
  refreshBuyPrice = async (masterItemId: number) => {
    // 1. Cek apakah ada Override Harga terakhir?
    const lastOverride = await this.prisma.itemBuyPriceOverride.findFirst({
      where: { masterItemId },
      orderBy: { createdAt: "desc" },
    });

    // Tentukan Cut-off Date (Jika tidak ada, ambil dari awal jaman)
    const startDate = lastOverride ? lastOverride.createdAt : new Date(0);

    // 2. Siapkan Nilai Awal (Initial State)
    let initialQty = 0;
    let initialAmount = new Decimal(0);

    if (lastOverride) {
      // Jika ada override, stok saat itu dianggap sebagai "Pembelian Baru"
      // dengan harga yang ditentukan user.
      initialQty = lastOverride.snapshotStock;

      // Total Uang = Stok Snapshot * Harga Override
      initialAmount = lastOverride.newBuyPrice.mul(lastOverride.snapshotStock);
    }

    // 3. Agregasi Transaksi SETELAH tanggal Override
    const [purchaseAgg, returnAgg, variants] = await Promise.all([
      // A. Sum Pembelian (Setelah Override)
      this.prisma.transactionPurchaseItem.aggregate({
        _sum: {
          totalQty: true,
          // Menggunakan recordedTotalAmount karena ini nilai finansial final
          recordedAfterTaxAmount: true,
        },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionPurchase: {
            deletedAt: null,
            // [CRITICAL] Hanya ambil transaksi SETELAH override dibuat
            transactionDate: { gt: startDate },
          },
        },
      }),

      // B. Sum Retur Pembelian (Setelah Override)
      this.prisma.transactionPurchaseReturnItem.aggregate({
        _sum: {
          totalQty: true,
          recordedTotalAmount: true,
        },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionPurchaseReturn: {
            deletedAt: null,
            transactionDate: { gt: startDate },
          },
        },
      }),

      // C. Ambil semua variant untuk update profit
      this.prisma.masterItemVariant.findMany({
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          masterItem: { deletedAt: null },
        },
        select: {
          id: true,
          amount: true,
          sellPrice: true,
        },
      }),
    ]);

    // 4. Hitung Total Gabungan (Initial + Delta Transactions)
    const purchaseQty = purchaseAgg._sum.totalQty ?? 0;
    const returnQty = returnAgg._sum.totalQty ?? 0;

    // Decimal calculations
    const purchaseAmount =
      purchaseAgg._sum.recordedAfterTaxAmount ?? new Decimal(0);
    const returnAmount = returnAgg._sum.recordedTotalAmount ?? new Decimal(0);

    // Rumus: Qty Akhir = Awal + Beli - Retur
    const finalTotalQty = initialQty + purchaseQty - returnQty;

    // Rumus: Uang Akhir = Awal + Beli - Retur
    const finalTotalAmount = initialAmount
      .add(purchaseAmount)
      .sub(returnAmount);

    // 5. Hitung Average Price (Base Unit)
    let avgBuyPriceBaseUnit = new Decimal(0);

    // Hindari division by zero
    if (finalTotalQty > 0) {
      avgBuyPriceBaseUnit = finalTotalAmount.div(finalTotalQty);
    }
    // Edge case: Jika stok 0 atau minus, bisa diset 0 atau pertahankan harga lama.
    // Di sini kita set 0 atau harga override terakhir jika quantity habis tapi history ada.
    else if (lastOverride) {
      avgBuyPriceBaseUnit = lastOverride.newBuyPrice;
    }

    // 6. Lakukan Update secara ATOMIC & PARALEL
    await this.prisma.$transaction(async (tx) => {
      const updatePromises: Promise<unknown>[] = [];

      // A. Update Master Item (Base Price)
      const updateMasterPromise = tx.masterItem.update({
        where: { id: masterItemId },
        data: {
          recordedBuyPrice: avgBuyPriceBaseUnit,
        },
      });
      updatePromises.push(updateMasterPromise);

      // B. Update Semua Variant (Profit Analysis)
      for (const variant of variants) {
        // HPP Varian = Harga Rata-rata Base * Konversi
        const variantCostPrice = avgBuyPriceBaseUnit.mul(variant.amount);

        // Profit = Jual - HPP
        const profitAmount = variant.sellPrice.sub(variantCostPrice);
        let profitPercentage = new Decimal(0);

        // Hindari division by zero
        if (variantCostPrice.gt(0)) {
          // (profitAmount / variantCostPrice) * 100
          profitPercentage = profitAmount.div(variantCostPrice).mul(100);
        }

        const updateVariantPromise = tx.masterItemVariant.update({
          where: { id: variant.id },
          data: {
            recordedBuyPrice: variantCostPrice,
            recordedProfitAmount: profitAmount,
            recordedProfitPercentage: profitPercentage,
          },
        });

        updatePromises.push(updateVariantPromise);
      }

      await Promise.all(updatePromises);
    });
  };
}
