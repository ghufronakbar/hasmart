import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";

export class RefreshStockService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Menghitung ulang stok dari nol berdasarkan history transaksi
   * dan mengupdate nilai ItemBranch.recordedStock
   */
  refreshRealStock = async (branchId: number, masterItemId: number) => {
    // Jalankan semua query agregasi secara paralel untuk performa
    const [
      purchases,
      purchaseReturns,
      sales,
      salesReturns,
      transfersIn,
      transfersOut,
      adjustments,
      sells,
      sellReturns,
    ] = await Promise.all([
      // 1. Total Pembelian (+)
      this.prisma.transactionPurchaseItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionPurchase: {
            branchId: branchId,
            deletedAt: null,
          },
        },
      }),

      // 2. Total Retur Pembelian (-)
      this.prisma.transactionPurchaseReturnItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionPurchaseReturn: {
            branchId: branchId,
            deletedAt: null,
          },
        },
      }),

      // 3. Total Penjualan POS (-)
      this.prisma.transactionSalesItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionSales: {
            branchId: branchId,
            deletedAt: null,
          },
        },
      }),

      // 4. Total Retur Penjualan POS (+)
      this.prisma.transactionSalesReturnItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionSalesReturn: {
            branchId: branchId,
            deletedAt: null,
          },
        },
      }),

      // 5. Transfer Masuk (+) [UPDATED SCHEMA]
      // Cek ke tabel Item, lalu filter berdasarkan Header (toId)
      this.prisma.transactionTransferItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionTransfer: {
            toId: branchId, // Cabang sebagai penerima
            deletedAt: null,
          },
        },
      }),

      // 6. Transfer Keluar (-) [UPDATED SCHEMA]
      // Cek ke tabel Item, lalu filter berdasarkan Header (fromId)
      this.prisma.transactionTransferItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionTransfer: {
            fromId: branchId, // Cabang sebagai pengirim
            deletedAt: null,
          },
        },
      }),

      // 7. Adjustment (+/- tergantung nilai gapAmount)
      this.prisma.transactionAdjustment.aggregate({
        _sum: { totalGapAmount: true },
        where: {
          masterItemId: masterItemId,
          branchId: branchId,
          deletedAt: null,
        },
      }),

      // 8. Total Penjualan B2B (Sell) (-)
      this.prisma.transactionSellItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionSell: {
            branchId: branchId,
            deletedAt: null,
          },
        },
      }),

      // 9. Total Retur Penjualan B2B (Sell Return) (+)
      this.prisma.transactionSellReturnItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionSellReturn: {
            branchId: branchId,
            deletedAt: null,
          },
        },
      }),
    ]);

    // Ekstrak nilai (handle null jika tidak ada data)
    const totalPurchase = purchases._sum.totalQty ?? 0;
    const totalPurchaseReturn = purchaseReturns._sum.totalQty ?? 0;

    const totalSales = sales._sum.totalQty ?? 0;
    const totalSalesReturn = salesReturns._sum.totalQty ?? 0;

    const totalTransferIn = transfersIn._sum.totalQty ?? 0;
    const totalTransferOut = transfersOut._sum.totalQty ?? 0;

    // Adjustment dijumlahkan karena asumsinya nilai totalGapAmount
    // sudah positif (stok lebih) atau negatif (stok kurang) di database
    const totalAdjustment = adjustments._sum.totalGapAmount ?? 0;

    const totalSell = sells._sum.totalQty ?? 0;
    const totalSellReturn = sellReturns._sum.totalQty ?? 0;

    // Rumus Stok Akhir
    // Masuk (IN):
    // - Purchase
    // - Sales Return (POS)
    // - Sell Return (B2B)
    // - Transfer In
    // - Adjustment (jika positif)

    // Keluar (OUT):
    // - Sales (POS)
    // - Sell (B2B)
    // - Purchase Return
    // - Transfer Out
    // - Adjustment (jika negatif)

    const finalStock =
      totalPurchase +
      totalSalesReturn +
      totalSellReturn +
      totalTransferIn +
      totalAdjustment -
      (totalSales + totalSell + totalPurchaseReturn + totalTransferOut);

    // Update ke ItemBranch (Gunakan Upsert untuk jaga-jaga jika record belum ada)
    const updatedItemBranch = await this.prisma.itemBranch.upsert({
      where: {
        masterItemId_branchId: {
          masterItemId: masterItemId,
          branchId: branchId,
        },
      },
      update: {
        recordedStock: finalStock,
      },
      create: {
        masterItemId: masterItemId,
        branchId: branchId,
        recordedStock: finalStock,
        recordedFrontStock: 0,
      },
    });

    return updatedItemBranch;
  };

  refreshFrontStock = async (branchId: number, masterItemId: number) => {
    const [sales, salesReturns, frontStockTransfers] = await Promise.all([
      // 1. Total Penjualan POS (-)
      this.prisma.transactionSalesItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionSales: {
            branchId: branchId,
            deletedAt: null,
          },
        },
      }),

      // 2. Total Retur Penjualan POS (+)
      this.prisma.transactionSalesReturnItem.aggregate({
        _sum: { totalQty: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          transactionSalesReturn: {
            branchId: branchId,
            deletedAt: null,
          },
        },
      }),

      // 3. Total Transfer (+/-)
      this.prisma.frontStockTransferItem.aggregate({
        _sum: { totalAmount: true },
        where: {
          masterItemId: masterItemId,
          deletedAt: null,
          frontStockTransfer: {
            branchId: branchId,
            deletedAt: null,
          },
        },
      }),
    ]);

    // Ekstrak nilai (handle null jika tidak ada data)
    const totalSales = sales._sum.totalQty ?? 0;
    const totalSalesReturn = salesReturns._sum.totalQty ?? 0;
    const totalFrontStockTransfer = frontStockTransfers._sum.totalAmount ?? 0; // bisa minus atau plus

    // Rumus Stok Akhir
    // Masuk (IN):
    // - Sales Return (POS)

    // Keluar (OUT):
    // - Sales (POS)

    const finalStock = totalSalesReturn - totalSales + totalFrontStockTransfer;

    // Update ke ItemBranch (Gunakan Upsert untuk jaga-jaga jika record belum ada)
    const updatedItemBranch = await this.prisma.itemBranch.upsert({
      where: {
        masterItemId_branchId: {
          masterItemId: masterItemId,
          branchId: branchId,
        },
      },
      update: {
        recordedFrontStock: finalStock,
      },
      create: {
        masterItemId: masterItemId,
        branchId: branchId,
        recordedStock: 0,
        recordedFrontStock: finalStock,
      },
    });

    return updatedItemBranch;
  };
}
