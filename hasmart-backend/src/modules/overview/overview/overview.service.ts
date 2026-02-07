import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { FilterQueryType } from "src/middleware/use-filter";
import { Decimal } from "@prisma/client/runtime/library";

interface FinancialSummary {
  grossSales: number;
  totalReturns: number;
  netSales: number;
  netPurchase: number;
  transactionCount: number;
}

interface SalesTrendItem {
  date: string;
  value: number;
}

interface TopProductItem {
  name: string;
  soldQty: number;
  revenue: number;
}

interface StockAlertItem {
  name: string;
  code: string;
  currentStock: number;
  unit: string;
}

// Helper functions for date manipulation
const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const subYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() - years);
  return result;
};

const formatDate = (date: Date): string => {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
};

export class OverviewService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Build date range filter with fallback to 1 year
   */
  private getDateRange(filter?: FilterQueryType) {
    const now = new Date();
    const startDate = filter?.dateStart
      ? startOfDay(new Date(filter.dateStart))
      : startOfDay(subYears(now, 1));
    const endDate = filter?.dateEnd
      ? endOfDay(new Date(filter.dateEnd))
      : endOfDay(now);

    return { startDate, endDate };
  }

  /**
   * A. Financial Summary
   */
  getFinancialSummary = async (
    filter?: FilterQueryType,
    branchId?: number,
  ): Promise<FinancialSummary> => {
    const { startDate, endDate } = this.getDateRange(filter);

    const branchFilter = branchId ? { branchId } : {};
    const dateFilter = {
      transactionDate: { gte: startDate, lte: endDate },
      deletedAt: null,
      ...branchFilter,
    };

    // Parallel aggregate queries
    const [
      salesSum,
      sellSum,
      salesReturnSum,
      sellReturnSum,
      purchaseSum,
      purchaseReturnSum,
      salesCount,
      sellCount,
    ] = await Promise.all([
      // Gross Sales
      this.prisma.transactionSales.aggregate({
        _sum: { recordedTotalAmount: true },
        where: dateFilter,
      }),
      this.prisma.transactionSell.aggregate({
        _sum: { recordedTotalAmount: true },
        where: dateFilter,
      }),
      // Returns
      this.prisma.transactionSalesReturn.aggregate({
        _sum: { recordedTotalAmount: true },
        where: dateFilter,
      }),
      this.prisma.transactionSellReturn.aggregate({
        _sum: { recordedTotalAmount: true },
        where: dateFilter,
      }),
      // Purchase
      this.prisma.transactionPurchase.aggregate({
        _sum: { recordedTotalAmount: true },
        where: dateFilter,
      }),
      this.prisma.transactionPurchaseReturn.aggregate({
        _sum: { recordedTotalAmount: true },
        where: dateFilter,
      }),
      // Counts
      this.prisma.transactionSales.count({ where: dateFilter }),
      this.prisma.transactionSell.count({ where: dateFilter }),
    ]);

    // Prisma aggregate returns Decimal; use Decimal methods then convert to number
    const salesTotal = new Decimal(salesSum._sum.recordedTotalAmount || 0);
    const sellTotal = new Decimal(sellSum._sum.recordedTotalAmount || 0);
    const salesReturnTotal = new Decimal(
      salesReturnSum._sum.recordedTotalAmount || 0,
    );
    const sellReturnTotal = new Decimal(
      sellReturnSum._sum.recordedTotalAmount || 0,
    );
    const purchaseTotal = new Decimal(
      purchaseSum._sum.recordedTotalAmount || 0,
    );
    const purchaseReturnTotal = new Decimal(
      purchaseReturnSum._sum.recordedTotalAmount || 0,
    );

    const grossSales = salesTotal.add(sellTotal);
    const totalReturns = salesReturnTotal.add(sellReturnTotal);
    const netSales = grossSales.sub(totalReturns);
    const netPurchase = purchaseTotal.sub(purchaseReturnTotal);
    const transactionCount = salesCount + sellCount;

    return {
      grossSales: grossSales.toNumber(),
      totalReturns: totalReturns.toNumber(),
      netSales: netSales.toNumber(),
      netPurchase: netPurchase.toNumber(),
      transactionCount,
    };
  };

  /**
   * B. Sales Trend (daily aggregation)
   */
  getSalesTrend = async (
    filter?: FilterQueryType,
    branchId?: number,
  ): Promise<SalesTrendItem[]> => {
    const { startDate, endDate } = this.getDateRange(filter);

    const branchFilter = branchId ? { branchId } : {};
    const dateFilter = {
      transactionDate: { gte: startDate, lte: endDate },
      deletedAt: null,
      ...branchFilter,
    };

    const [salesData, sellData] = await Promise.all([
      this.prisma.transactionSales.findMany({
        where: dateFilter,
        select: { transactionDate: true, recordedTotalAmount: true },
      }),
      this.prisma.transactionSell.findMany({
        where: dateFilter,
        select: { transactionDate: true, recordedTotalAmount: true },
      }),
    ]);

    // Combine and group by date
    const dailyMap = new Map<string, number>();

    [...salesData, ...sellData].forEach((item) => {
      const dateKey = formatDate(new Date(item.transactionDate));
      const current = dailyMap.get(dateKey) || 0;
      // Convert Decimal to number for aggregation
      const amount = new Decimal(item.recordedTotalAmount).toNumber();
      dailyMap.set(dateKey, current + amount);
    });

    // Convert to array and sort by date
    const result: SalesTrendItem[] = Array.from(dailyMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  };

  /**
   * C. Top Selling Products (Pareto)
   */
  getTopProducts = async (
    filter?: FilterQueryType,
    branchId?: number,
  ): Promise<TopProductItem[]> => {
    const { startDate, endDate } = this.getDateRange(filter);

    // We need to join through TransactionSales to filter by branch and date
    const branchFilter = branchId ? { branchId } : {};
    const dateFilter = {
      transactionDate: { gte: startDate, lte: endDate },
      deletedAt: null,
      ...branchFilter,
    };

    // Get sales items with their parent transaction for filtering
    const salesItems = await this.prisma.transactionSalesItem.findMany({
      where: {
        deletedAt: null,
        transactionSales: dateFilter,
      },
      select: {
        masterItemId: true,
        totalQty: true,
        recordedTotalAmount: true,
      },
    });

    // Group by masterItemId
    const itemMap = new Map<number, { soldQty: number; revenue: number }>();

    salesItems.forEach((item) => {
      const existing = itemMap.get(item.masterItemId) || {
        soldQty: 0,
        revenue: 0,
      };
      // Convert Decimal to number for aggregation
      const amount = new Decimal(item.recordedTotalAmount).toNumber();
      itemMap.set(item.masterItemId, {
        soldQty: existing.soldQty + item.totalQty,
        revenue: existing.revenue + amount,
      });
    });

    // Sort by soldQty descending and take top 5
    const topItemIds = Array.from(itemMap.entries())
      .sort((a, b) => b[1].soldQty - a[1].soldQty)
      .slice(0, 5);

    if (topItemIds.length === 0) return [];

    // Hydrate with item names
    const items = await this.prisma.masterItem.findMany({
      where: { id: { in: topItemIds.map(([id]) => id) } },
      select: { id: true, name: true },
    });

    const itemNameMap = new Map(items.map((i) => [i.id, i.name]));

    return topItemIds.map(([id, data]) => ({
      name: itemNameMap.get(id) || "Unknown",
      soldQty: data.soldQty,
      revenue: data.revenue,
    }));
  };

  /**
   * D. Low Stock Alerts
   */
  getStockAlerts = async (branchId?: number): Promise<StockAlertItem[]> => {
    const threshold = 10;

    const branchFilter = branchId ? { branchId } : {};

    const lowStockItems = await this.prisma.itemBranch.findMany({
      where: {
        recordedStock: { lte: threshold },
        deletedAt: null,
        masterItem: {
          isActive: true,
          deletedAt: null,
        },
        ...branchFilter,
      },
      include: {
        masterItem: {
          select: {
            name: true,
            code: true,
            masterItemVariants: {
              where: { isBaseUnit: true, deletedAt: null },
              select: { unit: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { recordedStock: "asc" },
      take: 10,
    });

    return lowStockItems.map((item) => ({
      name: item.masterItem.name,
      code: item.masterItem.code,
      currentStock: item.recordedStock,
      unit: item.masterItem.masterItemVariants[0]?.unit || "PCS",
    }));
  };
}
