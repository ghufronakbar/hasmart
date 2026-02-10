import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";

export class RefreshBuyPriceService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Mengupdate harga beli (HPP).
   * * @param masterItemId ID Item
   * @param incomingBaseQty (Bisa 0 jika isOverride = true)
   * @param incomingBuyPricePerBaseUnit (Harga Baru / Harga Rata-rata Pembelian)
   * @param isOverride (NEW PARAMETER) Jika true, harga akan di-hard set (Reset), mengabaikan Moving Average.
   */
  refreshBuyPrice = async (
    masterItemId: number,
    incomingBaseQty: number,
    incomingBuyPricePerBaseUnit: Decimal | number,
    isOverride: boolean,
  ) => {
    const incomingQtyDecimal = new Decimal(incomingBaseQty);
    const incomingPriceDecimal = new Decimal(incomingBuyPricePerBaseUnit);

    // 1. Ambil Data
    const [masterItem, branchesStock] = await Promise.all([
      this.prisma.masterItem.findUnique({
        where: { id: masterItemId },
        select: { id: true, recordedBuyPrice: true },
      }),
      this.prisma.itemBranch.aggregate({
        _sum: { recordedStock: true },
        where: { masterItemId, deletedAt: null },
      }),
    ]);

    if (!masterItem) throw new Error(`Item with ID ${masterItemId} not found`);

    const currentGlobalStock = branchesStock._sum.recordedStock ?? 0;

    // Default harga baru = harga lama
    let newAvgPrice = masterItem.recordedBuyPrice;

    // ====================================================
    // LOGIKA 1: PENENTUAN HARGA BARU
    // ====================================================

    // CASE SPESIAL: OVERRIDE (Hard Reset)
    // Langsung pakai harga inputan, abaikan stok & history.
    if (isOverride) {
      newAvgPrice = incomingPriceDecimal;

      // Update Master Item Langsung
      if (!newAvgPrice.equals(masterItem.recordedBuyPrice)) {
        await this.prisma.masterItem.update({
          where: { id: masterItemId },
          data: { recordedBuyPrice: newAvgPrice },
        });
      }
    }
    // CASE NORMAL: MOVING AVERAGE (Hanya jika ada qty berubah)
    else if (incomingBaseQty !== 0) {
      // ... (Logika Moving Average sama seperti sebelumnya) ...

      if (incomingBaseQty > 0) {
        if (currentGlobalStock - incomingBaseQty <= 0) {
          newAvgPrice = incomingPriceDecimal;
        } else {
          const oldStock = currentGlobalStock - incomingBaseQty;
          const totalOldValue = masterItem.recordedBuyPrice.mul(oldStock);
          const totalNewValue = incomingPriceDecimal.mul(incomingQtyDecimal);

          if (currentGlobalStock > 0) {
            newAvgPrice = totalOldValue
              .add(totalNewValue)
              .div(currentGlobalStock);
          } else {
            newAvgPrice = incomingPriceDecimal;
          }
        }
      } else {
        // Logika Hapus (Negatif)
        const stockBeforeDelete = currentGlobalStock - incomingBaseQty;
        if (stockBeforeDelete <= 0) {
          newAvgPrice = masterItem.recordedBuyPrice;
        } else {
          const positiveQtyToDelete = Math.abs(incomingBaseQty);
          const stockOriginal = currentGlobalStock + positiveQtyToDelete;
          const totalValueOriginal =
            masterItem.recordedBuyPrice.mul(stockOriginal);
          const valueToDelete = incomingPriceDecimal.mul(positiveQtyToDelete);
          const totalValueRemaining = totalValueOriginal.sub(valueToDelete);

          if (currentGlobalStock > 0) {
            newAvgPrice = totalValueRemaining.div(currentGlobalStock);
            if (newAvgPrice.lt(0)) newAvgPrice = masterItem.recordedBuyPrice;
          } else {
            newAvgPrice = masterItem.recordedBuyPrice;
          }
        }
      }

      // Update Master Item
      if (!newAvgPrice.equals(masterItem.recordedBuyPrice)) {
        await this.prisma.masterItem.update({
          where: { id: masterItemId },
          data: { recordedBuyPrice: newAvgPrice },
        });
      }
    }

    // ====================================================
    // LOGIKA 2: SELALU JALAN (REFRESH VARIAN & PROFIT)
    // ====================================================
    // (Kode bawah tetap sama, untuk update profit varian berdasarkan newAvgPrice)

    await this.prisma.$transaction(async (tx) => {
      const variants = await tx.masterItemVariant.findMany({
        where: { masterItemId, deletedAt: null },
      });

      for (const variant of variants) {
        const variantNewBuyPrice = newAvgPrice.mul(variant.amount);
        const profitAmount = variant.sellPrice.sub(variantNewBuyPrice);
        let profitPercentage = new Decimal(0);

        if (variantNewBuyPrice.gt(0)) {
          profitPercentage = profitAmount.div(variantNewBuyPrice).mul(100);
        }

        await tx.masterItemVariant.update({
          where: { id: variant.id },
          data: {
            recordedBuyPrice: variantNewBuyPrice,
            recordedProfitAmount: profitAmount,
            recordedProfitPercentage: profitPercentage,
          },
        });
      }
    });
  };
}
