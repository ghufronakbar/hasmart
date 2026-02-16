import {
  LedgerStockActionType,
  LedgerStockModelType,
  Prisma,
  PrismaClient,
} from ".prisma/client";
import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CommonRecordModel,
  RecordAdjustmentPayloadCreate,
  RecordAdjustmentPayloadDelete,
  RecordCommonPayloadCreate,
  RecordCommonPayloadDelete,
  RecordCommonPayloadUpdate,
  RecordTransferPayloadCreate,
} from "./record-ledger-stock.interface";
import { BadRequestError } from "../../../utils/error";
import { ItemService } from "../../master/item/item.service";
import { DefaultArgs } from "@prisma/client/runtime/library";

/**
 * Konfigurasi arah stok per tipe transaksi:
 * - stockDirection: 1 = stok masuk (purchase, return penjualan), -1 = stok keluar (penjualan, return pembelian)
 * - relationField: field relasi opsional di LedgerStock ("masterSupplierId" atau "masterMemberId")
 */
const STOCK_CONFIG: Record<
  CommonRecordModel,
  {
    stockDirection: 1 | -1;
    relationField: "masterSupplierId" | "masterMemberId";
  }
> = {
  TRANSACTION_PURCHASE: {
    stockDirection: 1,
    relationField: "masterSupplierId",
  },
  TRANSACTION_PURCHASE_RETURN: {
    stockDirection: -1,
    relationField: "masterSupplierId",
  },
  TRANSACTION_SALES: { stockDirection: -1, relationField: "masterMemberId" },
  TRANSACTION_SALES_RETURN: {
    stockDirection: 1,
    relationField: "masterMemberId",
  },
  TRANSACTION_SELL: { stockDirection: -1, relationField: "masterMemberId" },
  TRANSACTION_SELL_RETURN: {
    stockDirection: 1,
    relationField: "masterMemberId",
  },
};

export class RecordLedgerStockService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly itemSvc: ItemService,
  ) {
    super();
  }

  private validateCommonCreate = async (payload: RecordCommonPayloadCreate) => {
    const { modelType, masterMemberId, masterSupplierId } = payload;
    switch (modelType) {
      case "TRANSACTION_PURCHASE":
      case "TRANSACTION_PURCHASE_RETURN":
        if (!masterSupplierId)
          throw new BadRequestError("Master supplier is required");
        break;
      case "TRANSACTION_SELL":
      case "TRANSACTION_SELL_RETURN":
        if (!masterMemberId)
          throw new BadRequestError("Master member is required");
        break;
      // untuk sales, member optional
    }
  };

  /**
   * Mencatat perubahan stok ke ledger stock saat CREATE transaksi.
   *
   * @note
   * - gapAmount positif = stok masuk (purchase, return penjualan)
   * - gapAmount negatif = stok keluar (penjualan, return pembelian)
   * - beforeDataAmount = 0 karena ini transaksi baru (belum ada data sebelumnya)
   * - recordedStockBeforeAmount = stok saat ini di branch sebelum perubahan
   * - recordedStockAfterAmount = stok setelah perubahan (before + gap)
   */
  recordCommonCreate = async (payload: RecordCommonPayloadCreate) => {
    const {
      parentId,
      userId,
      branchId,
      modelType,
      items,
      transactionDate,
      masterMemberId,
      masterSupplierId,
    } = payload;
    await this.validateCommonCreate(payload);

    const config = STOCK_CONFIG[modelType];

    // Ambil stok terkini per item sekaligus (1 query, bukan N query)
    const masterItemIds = items.map((item) => item.masterItemId);
    const masterItems = await this.itemSvc.getItemStockByIds(
      masterItemIds,
      branchId,
    );

    // Tentukan value relasi (supplier atau member)
    const relationValue =
      config.relationField === "masterSupplierId"
        ? masterSupplierId
        : masterMemberId;

    // Buat semua ledger entry secara paralel
    const promises = items.map((txItem) => {
      const masterItem = masterItems.find(
        (mi) => mi.id === txItem.masterItemId,
      );
      if (!masterItem) {
        this.warn(`Master item id=${txItem.masterItemId} not found, skipping`);
        return Promise.resolve();
      }

      // gapAmount = totalQty * direction (positif/negatif sesuai tipe transaksi)
      const gapAmount = txItem.totalQty * config.stockDirection;

      return this.prisma.ledgerStock.create({
        data: {
          parentId,
          actionType: LedgerStockActionType.CREATE,
          modelId: txItem.id,
          modelType: modelType,
          beforeDataAmount: 0, // CREATE = tidak ada data sebelumnya
          recordedStockBeforeAmount: masterItem.recordedStock,
          gapAmount,
          // inputtedAmount: gapAmount, // karena create maka sama dengan gap amount
          recordedStockAfterAmount: masterItem.recordedStock + gapAmount,
          transactionDate,
          userId,
          branchId,
          masterItemId: masterItem.id,
          [config.relationField]: relationValue,
        },
      });
    });

    await Promise.all(promises);
  };

  /**
   * Mencatat perubahan stok ke ledger stock saat UPDATE transaksi.
   *
   * @note
   * - Items lama sudah di-hard-delete dari DB sebelum method ini dipanggil,
   *   sehingga oldTotalQty harus disediakan oleh caller di dalam payload items.
   * - gapAmount = selisih bersih antara qty baru dan qty lama, dikalikan direction
   *   Contoh purchase: oldTotalQty=10, totalQty=15 → gap = (15-10) * 1 = +5
   *   Contoh sales:    oldTotalQty=10, totalQty=15 → gap = (15-10) * -1 = -5
   * - beforeDataAmount = oldTotalQty (qty data lama, untuk audit trail)
   */
  recordCommonUpdate = async (payload: RecordCommonPayloadUpdate) => {
    const {
      parentId,
      userId,
      branchId,
      modelType,
      items,
      transactionDate,
      masterMemberId,
      masterSupplierId,
    } = payload;

    const config = STOCK_CONFIG[modelType];

    // Ambil stok terkini per item sekaligus
    const masterItemIds = items.map((item) => item.masterItemId);
    const masterItems = await this.itemSvc.getItemStockByIds(
      masterItemIds,
      branchId,
    );

    // Tentukan value relasi (supplier atau member)
    const relationValue =
      config.relationField === "masterSupplierId"
        ? masterSupplierId
        : masterMemberId;

    // Buat ledger entries secara paralel
    const promises = items.map((txItem) => {
      const masterItem = masterItems.find(
        (mi) => mi.id === txItem.masterItemId,
      );
      if (!masterItem) {
        this.warn(`Master item id=${txItem.masterItemId} not found, skipping`);
        return Promise.resolve();
      }

      // gapAmount = selisih (newQty - oldQty) * direction
      // Contoh: purchase, old=10 new=15 → (15-10) * 1 = +5 (stok bertambah 5)
      // Contoh: purchase, old=15 new=10 → (10-15) * 1 = -5 (stok berkurang 5)
      const gapAmount =
        (txItem.totalQty - txItem.oldTotalQty) * config.stockDirection;

      return this.prisma.ledgerStock.create({
        data: {
          parentId,
          actionType: LedgerStockActionType.UPDATE,
          modelId: txItem.id,
          modelType,
          beforeDataAmount: txItem.oldTotalQty, // qty data lama (audit: sebelumnya berapa)
          recordedStockBeforeAmount: masterItem.recordedStock,
          gapAmount, // selisih bersih antara qty baru dan lama
          // inputtedAmount: txItem.totalQty, // yang diinput user
          recordedStockAfterAmount: masterItem.recordedStock + gapAmount,
          transactionDate,
          userId,
          branchId,
          masterItemId: masterItem.id,
          [config.relationField]: relationValue,
        },
      });
    });

    await Promise.all(promises);
  };

  /**
   * Mencatat perubahan stok ke ledger stock saat DELETE transaksi.
   *
   * @note
   * - Saat delete, efek stoknya dibalik dari saat create:
   *   - Purchase (create = stok masuk) → delete = stok keluar
   *   - Sales (create = stok keluar) → delete = stok masuk
   * - beforeDataAmount = totalQty item sebelum dihapus (untuk audit trail)
   * - gapAmount = kebalikan dari create (direction * -1)
   */
  recordCommonDelete = async (payload: RecordCommonPayloadDelete) => {
    const { parentId, modelType, userId } = payload;
    const config = STOCK_CONFIG[modelType];

    // Fetch transaksi beserta items berdasarkan tipe
    const txData = await this.fetchTransactionForDelete(parentId, modelType);
    if (!txData) {
      this.warn(`Transaction ${modelType} id=${parentId} not found`);
      return;
    }

    // Ambil stok terkini per item sekaligus
    const masterItemIds = txData.items.map((item) => item.masterItemId);
    const masterItems = await this.itemSvc.getItemStockByIds(
      masterItemIds,
      txData.branchId,
    );

    // Tentukan value relasi (supplier atau member)
    const relationValue =
      config.relationField === "masterSupplierId"
        ? txData.supplierId
        : txData.memberId;

    // Buat ledger entries secara paralel
    // Saat delete, arah stok dibalik: stockDirection * -1
    const deleteDirection = config.stockDirection * -1;

    const promises = txData.items.map((txItem) => {
      const masterItem = masterItems.find(
        (mi) => mi.id === txItem.masterItemId,
      );
      if (!masterItem) {
        this.warn(`Master item id=${txItem.masterItemId} not found, skipping`);
        return Promise.resolve();
      }

      // gapAmount = totalQty * deleteDirection (kebalikan dari create)
      const gapAmount = txItem.totalQty * deleteDirection;

      return this.prisma.ledgerStock.create({
        data: {
          parentId,
          actionType: LedgerStockActionType.DELETE,
          modelId: txItem.id,
          modelType: modelType,
          beforeDataAmount: txItem.totalQty, // data qty sebelum dihapus (untuk audit)
          recordedStockBeforeAmount: masterItem.recordedStock,
          gapAmount,
          // inputtedAmount: txItem.totalQty, // yang diinput user
          recordedStockAfterAmount: masterItem.recordedStock + gapAmount,
          transactionDate: txData.transactionDate,
          userId,
          branchId: txData.branchId,
          masterItemId: masterItem.id,
          [config.relationField]: relationValue,
        },
      });
    });

    await Promise.all(promises);
  };

  /**
   * Helper: fetch data transaksi + items untuk delete.
   * Mengembalikan format yang seragam agar recordCommonDelete tidak perlu switch-case per tipe.
   */
  private fetchTransactionForDelete = async (
    parentId: number,
    modelType: CommonRecordModel,
  ): Promise<{
    branchId: number;
    transactionDate: Date;
    supplierId?: number;
    memberId?: number;
    items: { id: number; masterItemId: number; totalQty: number }[];
  } | null> => {
    switch (modelType) {
      case "TRANSACTION_PURCHASE": {
        const tx = await this.prisma.transactionPurchase.findUnique({
          where: { id: parentId },
          select: {
            branchId: true,
            transactionDate: true,
            masterSupplierId: true,
            transactionPurchaseItems: {
              select: { id: true, masterItemId: true, totalQty: true },
            },
          },
        });
        if (!tx) return null;
        return {
          branchId: tx.branchId,
          transactionDate: tx.transactionDate,
          supplierId: tx.masterSupplierId,
          items: tx.transactionPurchaseItems,
        };
      }

      case "TRANSACTION_PURCHASE_RETURN": {
        const tx = await this.prisma.transactionPurchaseReturn.findUnique({
          where: { id: parentId },
          select: {
            branchId: true,
            transactionDate: true,
            masterSupplierId: true,
            transactionPurchaseReturnItems: {
              select: { id: true, masterItemId: true, totalQty: true },
            },
          },
        });
        if (!tx) return null;
        return {
          branchId: tx.branchId,
          transactionDate: tx.transactionDate,
          supplierId: tx.masterSupplierId,
          items: tx.transactionPurchaseReturnItems,
        };
      }

      case "TRANSACTION_SALES": {
        const tx = await this.prisma.transactionSales.findUnique({
          where: { id: parentId },
          select: {
            branchId: true,
            transactionDate: true,
            masterMemberId: true,
            transactionSalesItems: {
              select: { id: true, masterItemId: true, totalQty: true },
            },
          },
        });
        if (!tx) return null;
        return {
          branchId: tx.branchId,
          transactionDate: tx.transactionDate,
          memberId: tx.masterMemberId ?? undefined,
          items: tx.transactionSalesItems,
        };
      }

      case "TRANSACTION_SALES_RETURN": {
        const tx = await this.prisma.transactionSalesReturn.findUnique({
          where: { id: parentId },
          select: {
            branchId: true,
            transactionDate: true,
            masterMemberId: true,
            transactionSalesReturnItems: {
              select: { id: true, masterItemId: true, totalQty: true },
            },
          },
        });
        if (!tx) return null;
        return {
          branchId: tx.branchId,
          transactionDate: tx.transactionDate,
          memberId: tx.masterMemberId ?? undefined,
          items: tx.transactionSalesReturnItems,
        };
      }

      case "TRANSACTION_SELL": {
        const tx = await this.prisma.transactionSell.findUnique({
          where: { id: parentId },
          select: {
            branchId: true,
            transactionDate: true,
            masterMemberId: true,
            transactionSellItems: {
              select: { id: true, masterItemId: true, totalQty: true },
            },
          },
        });
        if (!tx) return null;
        return {
          branchId: tx.branchId,
          transactionDate: tx.transactionDate,
          memberId: tx.masterMemberId,
          items: tx.transactionSellItems,
        };
      }

      case "TRANSACTION_SELL_RETURN": {
        const tx = await this.prisma.transactionSellReturn.findUnique({
          where: { id: parentId },
          select: {
            branchId: true,
            transactionDate: true,
            masterMemberId: true,
            transactionSellReturnItems: {
              select: { id: true, masterItemId: true, totalQty: true },
            },
          },
        });
        if (!tx) return null;
        return {
          branchId: tx.branchId,
          transactionDate: tx.transactionDate,
          memberId: tx.masterMemberId,
          items: tx.transactionSellReturnItems,
        };
      }
    }
  };

  recordAdjustmentCreate = async (
    payload: RecordAdjustmentPayloadCreate,
    tx: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
  ) => {
    const {
      modelId,
      branchId,
      transactionDate,
      gapAmount,
      masterItemId,
      recordedStockAfterAmount,
      recordedStockBeforeAmount,
      userId,
    } = payload;
    await tx.ledgerStock.create({
      data: {
        modelId,
        parentId: modelId,
        actionType: LedgerStockActionType.CREATE,
        modelType: LedgerStockModelType.TRANSACTION_ADJUSTMENT,
        branchId,
        userId,
        transactionDate,
        recordedStockAfterAmount,
        recordedStockBeforeAmount,
        beforeDataAmount: 0, // karena create
        gapAmount,
        masterItemId,
      },
    });
  };

  recordAdjustmentDelete = async (
    payload: RecordAdjustmentPayloadDelete,
    tx: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
  ) => {
    const { branchId, modelId, userId } = payload;
    const adjustmentData = await tx.transactionAdjustment.findUnique({
      where: { id: modelId },
      select: {
        transactionDate: true,
        masterItemId: true,
        totalGapAmount: true,
        masterItem: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!adjustmentData) {
      throw new BadRequestError("Adjustment data not found");
    }
    const item = await this.itemSvc.getItemById(adjustmentData.masterItem.id, {
      branchId,
    });
    await this.prisma.ledgerStock.create({
      data: {
        modelId,
        parentId: modelId,
        actionType: LedgerStockActionType.DELETE,
        modelType: LedgerStockModelType.TRANSACTION_ADJUSTMENT,
        branchId,
        userId,
        transactionDate: adjustmentData.transactionDate,
        recordedStockAfterAmount: item.stock - adjustmentData.totalGapAmount, // kalkulasi stock setelah delete
        recordedStockBeforeAmount: item.stock,
        beforeDataAmount: adjustmentData.totalGapAmount, // data lama
        masterItemId: adjustmentData.masterItemId,
        gapAmount: -adjustmentData.totalGapAmount, // kebalikan dari create
      },
    });
  };

  recordTransferCreate = async (
    payload: RecordTransferPayloadCreate,
    tx: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
  ) => {
    const { parentId, branchId, transactionDate, toBranchId, items, userId } =
      payload;
    // OUT
    const itemStocksFromOut = await this.itemSvc.getItemStockByIds(
      items.map((item) => item.masterItemId),
      branchId,
    );
    await Promise.all(
      items.map(async (item) => {
        const itemStock = itemStocksFromOut.find(
          (itemStock) => itemStock.id === item.masterItemId,
        );
        if (!itemStock) {
          this.warn(`Item stock not found for item ${item.masterItemId}`);
        }
        await tx.ledgerStock.create({
          data: {
            modelId: item.id,
            parentId: parentId,
            actionType: LedgerStockActionType.CREATE,
            modelType: LedgerStockModelType.TRANSACTION_TRANSFER_OUT,
            branchId,
            userId,
            transactionDate,
            toBranchId,
            beforeDataAmount: 0, // karena create
            gapAmount: -item.totalQty,
            recordedStockAfterAmount:
              (itemStock?.recordedStock || 0) - item.totalQty,
            recordedStockBeforeAmount: itemStock?.recordedStock || 0, // catat stock sebelum transfer
            masterItemId: item.masterItemId,
          },
        });
      }),
    );

    // IN
    const itemStocksFromIn = await this.itemSvc.getItemStockByIds(
      items.map((item) => item.masterItemId),
      toBranchId,
    );
    await Promise.all(
      items.map(async (item) => {
        const itemStock = itemStocksFromIn.find(
          (itemStock) => itemStock.id === item.masterItemId,
        );
        if (!itemStock) {
          this.warn(`Item stock not found for item ${item.masterItemId}`);
        }
        // tidak perlu to branch (karena sebagai penerima)
        await tx.ledgerStock.create({
          data: {
            modelId: item.id,
            parentId: parentId,
            actionType: LedgerStockActionType.CREATE,
            modelType: LedgerStockModelType.TRANSACTION_TRANSFER_IN,
            branchId: toBranchId,
            userId,
            transactionDate,
            beforeDataAmount: 0, // karena create
            gapAmount: item.totalQty,
            recordedStockAfterAmount:
              (itemStock?.recordedStock || 0) + item.totalQty,
            recordedStockBeforeAmount: itemStock?.recordedStock || 0, // catat stock sebelum transfer
            masterItemId: item.masterItemId,
          },
        });
      }),
    );
  };
}
