import { BaseService, Pagination } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { LedgerStockQueryType } from "./ledger-stock.validator";
import { FilterQueryType } from "src/middleware/use-filter";
import {
  LedgerStockModelType,
  MasterMember,
  MasterMemberCategory,
  MasterSupplier,
  Branch,
  Prisma,
} from ".prisma/client";
import { LedgerStockItemResponse } from "./ledger-stock.interface";

export class LedgerStockService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Membuat where clause untuk query ledger stock.
   *
   * branchId filter: jika ada, filter berdasarkan branchId OR fromBranchId OR toBranchId
   * (agar saat filter cabang tertentu, tetap muncul data transfer masuk/keluar)
   */
  private constructWhere(
    params: LedgerStockQueryType,
    filter?: FilterQueryType,
  ): Prisma.LedgerStockWhereInput {
    const where: Prisma.LedgerStockWhereInput = {
      deletedAt: null,
    };

    // Filter by branchId (OR branchId, fromBranchId, toBranchId)
    if (params.branchId) {
      where.OR = [
        { branchId: params.branchId },
        { fromBranchId: params.branchId },
        { toBranchId: params.branchId },
      ];
    }

    // Filter by modelType
    if (params.modelType) {
      where.modelType = params.modelType;
    }

    // Filter by actionType
    if (params.actionType) {
      where.actionType = params.actionType;
    }

    // Filter by masterItemId
    if (params.masterItemId) {
      where.masterItemId = params.masterItemId;
    }

    // Filter by masterMemberId
    if (params.masterMemberId) {
      where.masterMemberId = params.masterMemberId;
    }

    // Filter by masterSupplierId
    if (params.masterSupplierId) {
      where.masterSupplierId = params.masterSupplierId;
    }

    // Date range filter (gunakan sort field dari params sebagai target date column)
    const dateField =
      filter?.sortBy === "transactionDate" ? "transactionDate" : "createdAt";
    if (filter?.dateStart || filter?.dateEnd) {
      where[dateField] = {
        ...(filter?.dateStart ? { gte: filter.dateStart } : {}),
        ...(filter?.dateEnd ? { lte: filter.dateEnd } : {}),
      };
    }

    return where;
  }

  /**
   * Membuat findMany args untuk query ledger stock.
   * Include relasi: masterItem, user, member (+ category), supplier, branch, toBranch, fromBranch
   */
  private constructArgs(
    params: LedgerStockQueryType,
    filter?: FilterQueryType,
  ): Prisma.LedgerStockFindManyArgs {
    const args: Prisma.LedgerStockFindManyArgs = {
      where: this.constructWhere(params, filter),
      skip: filter?.skip,
      take: filter?.limit,
      orderBy: {
        [filter?.sortBy || "createdAt"]: filter?.sort || "desc",
      },
      include: {
        masterItem: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            code: true,
            masterMemberCategory: {
              select: {
                code: true,
              },
            },
          },
        },
        masterSupplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        toBranch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        fromBranch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    };

    return args;
  }

  /**
   * Helper format tanggal ke DD-MM-YYYY
   */
  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  /**
   * Batch-fetch invoice numbers dari semua parent transactions sekaligus.
   * Menghindari query dalam loop (N+1 problem).
   *
   * Cara kerja:
   * 1. Kumpulkan unique parentId per modelType dari rows
   * 2. Query setiap tabel transaksi sekali saja dengan findMany({ where: { id: { in: [...] } } })
   * 3. Bangun Map<"modelType_parentId", invoiceNumber> untuk lookup cepat
   *
   * Transfer & Adjustment tidak perlu query DB (di-format dari transactionDate).
   */
  private async batchFetchInvoiceNumbers(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[],
  ): Promise<Map<string, string>> {
    const invoiceMap = new Map<string, string>();

    // Kelompokkan parentId per modelType (hanya yang perlu query DB)
    const purchaseIds = new Set<number>();
    const purchaseReturnIds = new Set<number>();
    const salesIds = new Set<number>();
    const salesReturnIds = new Set<number>();
    const sellIds = new Set<number>();
    const sellReturnIds = new Set<number>();

    for (const row of rows) {
      switch (row.modelType as LedgerStockModelType) {
        case "TRANSACTION_PURCHASE":
          purchaseIds.add(row.parentId);
          break;
        case "TRANSACTION_PURCHASE_RETURN":
          purchaseReturnIds.add(row.parentId);
          break;
        case "TRANSACTION_SALES":
          salesIds.add(row.parentId);
          break;
        case "TRANSACTION_SALES_RETURN":
          salesReturnIds.add(row.parentId);
          break;
        case "TRANSACTION_SELL":
          sellIds.add(row.parentId);
          break;
        case "TRANSACTION_SELL_RETURN":
          sellReturnIds.add(row.parentId);
          break;
        // Transfer & Adjustment: tidak perlu query, langsung format dari transactionDate
        case "TRANSACTION_TRANSFER_IN":
        case "TRANSACTION_TRANSFER_OUT":
          invoiceMap.set(
            `${row.modelType}_${row.parentId}`,
            `TRANSFER ${this.formatDate(row.transactionDate)}`,
          );
          break;
        case "TRANSACTION_ADJUSTMENT":
          invoiceMap.set(
            `${row.modelType}_${row.parentId}`,
            `ADJ ${this.formatDate(row.transactionDate)}`,
          );
          break;
      }
    }

    // Batch query semua tabel transaksi secara paralel (hanya yang ada parentId-nya)
    const [
      purchases,
      purchaseReturns,
      sales,
      salesReturns,
      sells,
      sellReturns,
    ] = await Promise.all([
      purchaseIds.size > 0
        ? this.prisma.transactionPurchase.findMany({
            where: { id: { in: [...purchaseIds] } },
            select: { id: true, invoiceNumber: true },
          })
        : [],
      purchaseReturnIds.size > 0
        ? this.prisma.transactionPurchaseReturn.findMany({
            where: { id: { in: [...purchaseReturnIds] } },
            select: { id: true, invoiceNumber: true },
          })
        : [],
      salesIds.size > 0
        ? this.prisma.transactionSales.findMany({
            where: { id: { in: [...salesIds] } },
            select: { id: true, invoiceNumber: true },
          })
        : [],
      salesReturnIds.size > 0
        ? this.prisma.transactionSalesReturn.findMany({
            where: { id: { in: [...salesReturnIds] } },
            select: { id: true, returnNumber: true },
          })
        : [],
      sellIds.size > 0
        ? this.prisma.transactionSell.findMany({
            where: { id: { in: [...sellIds] } },
            select: { id: true, invoiceNumber: true },
          })
        : [],
      sellReturnIds.size > 0
        ? this.prisma.transactionSellReturn.findMany({
            where: { id: { in: [...sellReturnIds] } },
            select: { id: true, invoiceNumber: true },
          })
        : [],
    ]);

    // Masukkan hasil ke invoiceMap
    for (const tx of purchases) {
      invoiceMap.set(`TRANSACTION_PURCHASE_${tx.id}`, tx.invoiceNumber);
    }
    for (const tx of purchaseReturns) {
      invoiceMap.set(`TRANSACTION_PURCHASE_RETURN_${tx.id}`, tx.invoiceNumber);
    }
    for (const tx of sales) {
      invoiceMap.set(`TRANSACTION_SALES_${tx.id}`, tx.invoiceNumber);
    }
    for (const tx of salesReturns) {
      invoiceMap.set(`TRANSACTION_SALES_RETURN_${tx.id}`, tx.returnNumber);
    }
    for (const tx of sells) {
      invoiceMap.set(`TRANSACTION_SELL_${tx.id}`, tx.invoiceNumber);
    }
    for (const tx of sellReturns) {
      invoiceMap.set(`TRANSACTION_SELL_RETURN_${tx.id}`, tx.invoiceNumber);
    }

    return invoiceMap;
  }

  /**
   * Membangun additionalNote berdasarkan modelType:
   * - sell/sales/return: "memberName (memberCode) - memberCategoryCode"
   * - purchase/purchase-return: "supplierName (supplierCode)"
   * - transfer out: branch tujuan "branchName (branchCode)"
   * - transfer in: branch asal "branchName (branchCode)"
   * - adjustment: "Penyesuaian Stok - DD-MM-YYYY"
   */
  private buildAdditionalNote(
    modelType: LedgerStockModelType,
    row: {
      member?: {
        name: string;
        code: string;
        masterMemberCategory?: { code: string } | null;
      } | null;
      masterSupplier?: { name: string; code: string } | null;
      toBranch?: { name: string; code: string } | null;
      fromBranch?: { name: string; code: string } | null;
      transactionDate: Date;
    },
  ): string {
    switch (modelType) {
      case "TRANSACTION_SALES":
      case "TRANSACTION_SALES_RETURN":
      case "TRANSACTION_SELL":
      case "TRANSACTION_SELL_RETURN": {
        if (!row.member) return "";
        const catCode = row.member.masterMemberCategory?.code || "";
        return `${row.member.name} (${row.member.code})${catCode ? ` - ${catCode}` : ""}`;
      }
      case "TRANSACTION_PURCHASE":
      case "TRANSACTION_PURCHASE_RETURN": {
        if (!row.masterSupplier) return "";
        return `${row.masterSupplier.name} (${row.masterSupplier.code})`;
      }
      case "TRANSACTION_TRANSFER_OUT": {
        if (!row.toBranch) return "";
        return `${row.toBranch.name} (${row.toBranch.code})`;
      }
      case "TRANSACTION_TRANSFER_IN": {
        if (!row.fromBranch) return "";
        return `${row.fromBranch.name} (${row.fromBranch.code})`;
      }
      case "TRANSACTION_ADJUSTMENT":
        return `Penyesuaian Stok - ${this.formatDate(row.transactionDate)}`;
      default:
        return "";
    }
  }

  /**
   * Mengambil semua ledger stock dengan filter, sorting, dan pagination.
   * Mengembalikan data yang sudah di-map ke LedgerStockItemResponse.
   *
   * Alur:
   * 1. Query ledger stock + count secara paralel
   * 2. Batch-fetch semua invoice number dari parent transactions (tanpa loop query)
   * 3. Map rows ke response format secara synchronous
   */
  getAllLedgerStock = async (
    params: LedgerStockQueryType,
    filter?: FilterQueryType,
  ): Promise<{ rows: LedgerStockItemResponse[]; pagination: Pagination }> => {
    const [rows, count] = await Promise.all([
      this.prisma.ledgerStock.findMany(this.constructArgs(params, filter)),
      this.prisma.ledgerStock.count({
        where: this.constructWhere(params, filter),
      }),
    ]);

    const pagination = this.createPagination({
      total: count,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cRows = rows as any[];

    // Batch-fetch semua invoice number sekaligus (bukan dalam loop)
    const invoiceMap = await this.batchFetchInvoiceNumbers(cRows);

    // Map rows ke response (synchronous, tanpa query di dalam loop)
    const data: LedgerStockItemResponse[] = cRows.map((row) => {
      const cacheKey = `${row.modelType}_${row.parentId}`;
      const invoiceNumberReff = invoiceMap.get(cacheKey) || "";
      const additionalNote = this.buildAdditionalNote(row.modelType, row);

      return {
        id: row.id,
        masterItem: {
          id: row.masterItem.id,
          name: row.masterItem.name,
        },
        modelType: row.modelType,
        gapAmount: row.gapAmount,
        recordedStockAfterAmount: row.recordedStockAfterAmount,
        actionType: row.actionType,
        user: {
          id: row.user.id,
          name: row.user.name,
        },
        invoiceNumberReff,
        additionalNote,
        transactionDate: row.transactionDate,
        createdAt: row.createdAt,
      };
    });

    return { rows: data, pagination };
  };
}
