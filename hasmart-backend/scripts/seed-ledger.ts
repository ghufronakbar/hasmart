import {
  LedgerStockActionType,
  LedgerStockModelType,
  MasterMember,
  MasterSupplier,
  RecordActionModelType,
  RecordActionType,
  TransactionPurchase,
  TransactionPurchaseItem,
  TransactionSales,
  TransactionSalesItem,
  TransactionSell,
  TransactionSellItem,
  User,
} from "@prisma/client";
import { PrismaService } from "../src/modules/common/prisma/prisma.service";
import { ItemService } from "../src/modules/master/item/item.service";
import { RefreshBuyPriceService } from "../src/modules/transaction/refresh-buy-price/refresh-buy-price.service";
import { getFirstBranch } from "./seed-item";

interface PurchaseWithRelation extends TransactionPurchase {
  transactionPurchaseItems: TransactionPurchaseItem[];
  masterSupplier: MasterSupplier;
  user: User;
}

interface SalesWithRelation extends TransactionSales {
  transactionSalesItems: TransactionSalesItem[];
  masterMember: MasterMember | null;
  user: User;
}

interface SellWithRelation extends TransactionSell {
  transactionSellItems: TransactionSellItem[];
  masterMember: MasterMember;
  user: User;
}

type PurchaseSeed = {
  purchase: PurchaseWithRelation;
  date: Date;
  type: "purchase";
};

type SalesSeed = {
  sale: SalesWithRelation;
  date: Date;
  type: "sales";
};

type SellSeed = {
  sell: SellWithRelation;
  date: Date;
  type: "sell";
};

type SeedData = PurchaseSeed | SalesSeed | SellSeed;
type RecSeedData = SeedData[];

const prisma = new PrismaService();
const refreshBuyPriceService = new RefreshBuyPriceService(prisma);
const itemService = new ItemService(prisma, refreshBuyPriceService);

const typePriority: Record<string, number> = {
  purchase: 1,
  sales: 2,
  sell: 3,
};

async function ledgerSeed() {
  console.log("Ledger Seed Started");
  const recSeedData: RecSeedData = [];
  const ledgers = await prisma.ledgerStock.findMany();
  const existPurchaseIds = ledgers
    .filter((l) => l.modelType === RecordActionModelType.TRANSACTION_PURCHASE)
    .map((l) => l.modelId);
  const existSalesIds = ledgers
    .filter((l) => l.modelType === RecordActionModelType.TRANSACTION_SALES)
    .map((l) => l.modelId);
  const existSellIds = ledgers
    .filter((l) => l.modelType === RecordActionModelType.TRANSACTION_SELL)
    .map((l) => l.modelId);
  const [purchases, sales, sells] = await Promise.all([
    prisma.transactionPurchase.findMany({
      include: {
        transactionPurchaseItems: true,
        masterSupplier: true,
      },
      where: {
        id: {
          notIn: existPurchaseIds,
        },
      },
    }),
    prisma.transactionSales.findMany({
      include: {
        transactionSalesItems: true,
        masterMember: true,
      },
      where: {
        id: {
          notIn: existSalesIds,
        },
      },
    }),
    prisma.transactionSell.findMany({
      include: {
        transactionSellItems: true,
        masterMember: true,
      },
      where: {
        id: {
          notIn: existSellIds,
        },
      },
    }),
  ]);

  console.log("PURCHASE TOTAL: ", purchases.length);
  console.log("SALES TOTAL: ", sales.length);
  console.log("SELL TOTAL: ", sells.length);

  const [purchaseRecordActions, salesRecordActions, sellRecordActions] =
    await Promise.all([
      prisma.recordAction.findMany({
        where: {
          actionType: RecordActionType.CREATE,
          modelType: RecordActionModelType.TRANSACTION_PURCHASE,
          modelId: {
            in: purchases.map((p) => p.id),
          },
        },
      }),
      prisma.recordAction.findMany({
        where: {
          actionType: RecordActionType.CREATE,
          modelType: RecordActionModelType.TRANSACTION_SALES,
          modelId: {
            in: sales.map((s) => s.id),
          },
        },
      }),
      prisma.recordAction.findMany({
        where: {
          actionType: RecordActionType.CREATE,
          modelType: RecordActionModelType.TRANSACTION_SELL,
          modelId: {
            in: sells.map((s) => s.id),
          },
        },
      }),
    ]);

  console.log("PURCHASE RECORD ACTIONS TOTAL: ", purchaseRecordActions.length);
  console.log("SALES RECORD ACTIONS TOTAL: ", salesRecordActions.length);
  console.log("SELL RECORD ACTIONS TOTAL: ", sellRecordActions.length);

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [
          ...purchaseRecordActions,
          ...salesRecordActions,
          ...sellRecordActions,
        ].map((r) => r.userId),
      },
    },
  });

  console.log("USERS TOTAL: ", users.length);

  for (const purchase of purchases) {
    const recordAction = purchaseRecordActions.find(
      (r) => r.modelId === purchase.id,
    );
    const user = users.find((u) => u.id === recordAction?.userId);
    if (!user) {
      console.log("🟡 USER NOT FOUND FOR PURCHASE: ", purchase.id);
      continue;
    }
    recSeedData.push({
      purchase: {
        ...purchase,
        user: user!,
      },
      date: purchase.transactionDate,
      type: "purchase",
    });
  }

  for (const sale of sales) {
    const recordAction = salesRecordActions.find((r) => r.modelId === sale.id);
    const user = users.find((u) => u.id === recordAction?.userId);
    if (!user) {
      console.log("🟡 USER NOT FOUND FOR SALE: ", sale.id);
      continue;
    }
    recSeedData.push({
      sale: {
        ...sale,
        user: user!,
      },
      date: sale.transactionDate,
      type: "sales",
    });
  }

  for (const sell of sells) {
    const recordAction = sellRecordActions.find((r) => r.modelId === sell.id);
    const user = users.find((u) => u.id === recordAction?.userId);
    if (!user) {
      console.log("🟡 USER NOT FOUND FOR SELL: ", sell.id);
      continue;
    }
    recSeedData.push({
      sell: {
        ...sell,
        user: user!,
      },
      date: sell.transactionDate,
      type: "sell",
    });
  }

  recSeedData.sort((a, b) => {
    // Kondisi A: Bandingkan Waktu (Ascending)
    const dateDiff = a.date.getTime() - b.date.getTime();

    // Jika tanggal berbeda, kembalikan hasil perbandingan tanggal
    if (dateDiff !== 0) {
      return dateDiff;
    }

    // Kondisi B: Jika tanggal sama, bandingkan Tipe sesuai prioritas
    return typePriority[a.type] - typePriority[b.type];
  });

  const branch = await getFirstBranch();

  let totalPurchaseOk = 0;
  let totalSalesOk = 0;
  let totalSellOk = 0;
  let totalPurchaseFail = 0;
  let totalSalesFail = 0;
  let totalSellFail = 0;

  for await (const seed of recSeedData) {
    if (seed.type === "purchase") {
      for await (const item of seed.purchase.transactionPurchaseItems) {
        const beforeLedger = await prisma.ledgerStock.findFirst({
          where: {
            masterItemId: item.masterItemId,
            branchId: branch.id,
          },
          orderBy: {
            transactionDate: "desc",
          },
        });
        const gapAmount = item.totalQty;
        const lastStock = beforeLedger?.recordedStockAfterAmount || 0;
        await prisma.ledgerStock.create({
          data: {
            parentId: seed.purchase.id,
            actionType: LedgerStockActionType.CREATE,
            modelId: item.id,
            modelType: LedgerStockModelType.TRANSACTION_PURCHASE,
            beforeDataAmount: 0, // CREATE = tidak ada data sebelumnya
            recordedStockBeforeAmount:
              beforeLedger?.recordedStockAfterAmount || 0,
            gapAmount,
            // inputtedAmount: gapAmount, // karena create maka sama dengan gap amount
            recordedStockAfterAmount: lastStock + gapAmount,
            transactionDate: seed.date,
            createdAt: seed.date,
            updatedAt: seed.date,
            userId: seed.purchase.user.id,
            branchId: branch.id,
            masterItemId: item.masterItemId,
          },
        });
        totalPurchaseOk++;
      }
    } else if (seed.type === "sales") {
      for await (const item of seed.sale.transactionSalesItems) {
        const beforeLedger = await prisma.ledgerStock.findFirst({
          where: {
            masterItemId: item.masterItemId,
            branchId: branch.id,
          },
          orderBy: {
            transactionDate: "desc",
          },
        });
        const gapAmount = -item.totalQty; // karena penjualan
        const lastStock = beforeLedger?.recordedStockAfterAmount || 0;
        await prisma.ledgerStock.create({
          data: {
            parentId: seed.sale.id,
            actionType: LedgerStockActionType.CREATE,
            modelId: item.id,
            modelType: LedgerStockModelType.TRANSACTION_SALES,
            beforeDataAmount: 0, // CREATE = tidak ada data sebelumnya
            recordedStockBeforeAmount: lastStock,
            gapAmount,
            // inputtedAmount: gapAmount, // karena create maka sama dengan gap amount
            recordedStockAfterAmount: lastStock + gapAmount,
            transactionDate: seed.date,
            createdAt: seed.date,
            updatedAt: seed.date,
            userId: seed.sale.user.id,
            branchId: branch.id,
            masterItemId: item.masterItemId,
          },
        });
        totalSalesOk++;
      }
    } else if (seed.type === "sell") {
      for await (const item of seed.sell.transactionSellItems) {
        const beforeLedger = await prisma.ledgerStock.findFirst({
          where: {
            masterItemId: item.masterItemId,
            branchId: branch.id,
          },
          orderBy: {
            transactionDate: "desc",
          },
        });
        const gapAmount = -item.totalQty; // karena penjualan
        const lastStock = beforeLedger?.recordedStockAfterAmount || 0;
        await prisma.ledgerStock.create({
          data: {
            parentId: seed.sell.id,
            actionType: LedgerStockActionType.CREATE,
            modelId: item.id,
            modelType: LedgerStockModelType.TRANSACTION_SELL,
            beforeDataAmount: 0, // CREATE = tidak ada data sebelumnya
            recordedStockBeforeAmount: lastStock,
            gapAmount,
            // inputtedAmount: gapAmount, // karena create maka sama dengan gap amount
            recordedStockAfterAmount: lastStock + gapAmount,
            transactionDate: seed.date,
            createdAt: seed.date,
            updatedAt: seed.date,
            userId: seed.sell.user.id,
            branchId: branch.id,
            masterItemId: item.masterItemId,
          },
        });
        totalSellOk++;
      }
    }
  }

  console.log("Total Purchase OK: ", totalPurchaseOk);
  console.log("Total Sales OK: ", totalSalesOk);
  console.log("Total Sell OK: ", totalSellOk);
  console.log("Total Purchase Fail: ", totalPurchaseFail);
  console.log("Total Sales Fail: ", totalSalesFail);
  console.log("Total Sell Fail: ", totalSellFail);
  console.log("Ledger Seed Completed");
}

if (require.main === module) {
  ledgerSeed();
}
