// hasmart-backend/src/modules/report/report/report.service.ts
import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { FilterQueryType } from "src/middleware/use-filter";
import { Prisma } from ".prisma/client";
import { ReportQueryFilterType } from "./report.validator";
import { ReportPdfService } from "../report-pdf/report-pdf.service";
import { ReportXlsxService } from "../report-xlsx/report-xlsx.service";

import {
  PurchaseReportItem,
  ReportResult,
  SalesReportItem,
  SalesReturnReportItem,
  SellReportItem,
  SellReturnReportItem,
  ItemReportItem,
  MemberReportItem,
  MemberPurchaseReportItem,
} from "./report.interface";
import { BranchQueryType } from "src/middleware/use-branch";

export class ReportService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: ReportPdfService,
    private readonly xlsxService: ReportXlsxService,
  ) {
    super();
  }

  getPurchaseReport = async (
    query: ReportQueryFilterType,
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Promise<ReportResult> => {
    const where: Prisma.TransactionPurchaseWhereInput = {};
    where.deletedAt = null;

    if (branchQuery?.branchId) {
      where.branchId = branchQuery.branchId;
    }

    if (filter?.dateStart || filter?.dateEnd) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filter?.dateStart) dateFilter.gte = new Date(filter.dateStart);
      if (filter?.dateEnd) dateFilter.lte = new Date(filter.dateEnd);
      where.transactionDate = dateFilter;
    }

    const transactions = await this.prisma.transactionPurchase.findMany({
      where,
      include: {
        masterSupplier: true,
        transactionPurchaseItems: {
          include: {
            masterItem: true,
            masterItemVariant: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    const items: PurchaseReportItem[] = transactions.map((t) => ({
      id: t.id,
      transactionDate: t.transactionDate,
      invoiceNumber: t.invoiceNumber,
      supplierName: t.masterSupplier.name,

      subTotal: Number(t.recordedSubTotalAmount),
      discount: Number(t.recordedDiscountAmount),
      tax: Number(t.recordedTaxAmount),
      totalAmount: Number(t.recordedTotalAmount),

      items: t.transactionPurchaseItems.map((item) => ({
        itemName: item.masterItem.name,
        variantName: item.masterItemVariant.unit,
        qty: item.qty,

        price: Number(item.purchasePrice),
        discount: Number(item.recordedDiscountAmount),
        tax: Number(
          item.recordedAfterTaxAmount.minus(item.recordedTotalAmount),
        ),
        total: Number(item.recordedAfterTaxAmount),
      })),
    }));

    if (query?.exportAs === "pdf" || query?.exportAs === "preview") {
      const buffer = await this.pdfService.generatePurchaseReport(items);
      return {
        buffer,
        fileName: `purchase-report-${new Date().getTime()}.pdf`,
        mimeType: "application/pdf",
      };
    } else {
      const buffer = await this.xlsxService.generatePurchaseReport(items);
      return {
        buffer,
        fileName: `purchase-report-${new Date().getTime()}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
  };

  getPurchaseReturnReport = async (
    query: ReportQueryFilterType,
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Promise<ReportResult> => {
    const where: Prisma.TransactionPurchaseReturnWhereInput = {};
    where.deletedAt = null;

    if (branchQuery?.branchId) {
      where.branchId = branchQuery.branchId;
    }

    if (filter?.dateStart || filter?.dateEnd) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filter?.dateStart) dateFilter.gte = new Date(filter.dateStart);
      if (filter?.dateEnd) dateFilter.lte = new Date(filter.dateEnd);
      where.transactionDate = dateFilter;
    }

    const transactions = await this.prisma.transactionPurchaseReturn.findMany({
      where,
      include: {
        masterSupplier: true,
        transactionPurchaseReturnItems: {
          include: {
            masterItem: true,
            masterItemVariant: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    const items: PurchaseReportItem[] = transactions.map((t) => ({
      id: t.id,
      transactionDate: t.transactionDate,
      invoiceNumber: t.invoiceNumber,
      supplierName: t.masterSupplier.name,

      subTotal: Number(t.recordedSubTotalAmount),
      discount: Number(t.recordedDiscountAmount),
      tax: Number(t.recordedTaxAmount),
      totalAmount: Number(t.recordedTotalAmount),

      items: t.transactionPurchaseReturnItems.map((item) => ({
        itemName: item.masterItem.name,
        variantName: item.masterItemVariant.unit,
        qty: item.qty,

        price: Number(item.purchasePrice),
        discount: Number(item.recordedDiscountAmount),
        tax: Number(
          item.recordedTotalAmount.mul(t.recordedTaxPercentage.div(100)),
        ), // Estimate tax per item based on global tax percentage, as item-level tax isn't explicit here like purchase
        total: Number(item.recordedTotalAmount),
      })),
    }));

    if (query?.exportAs === "pdf" || query?.exportAs === "preview") {
      const buffer = await this.pdfService.generatePurchaseReturnReport(items);
      return {
        buffer,
        fileName: `purchase-return-report-${new Date().getTime()}.pdf`,
        mimeType: "application/pdf",
      };
    } else {
      const buffer = await this.xlsxService.generatePurchaseReturnReport(items);
      return {
        buffer,
        fileName: `purchase-return-report-${new Date().getTime()}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
  };

  getSalesReport = async (
    query: ReportQueryFilterType,
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Promise<ReportResult> => {
    const where: Prisma.TransactionSalesWhereInput = {};
    where.deletedAt = null;

    if (branchQuery?.branchId) {
      where.branchId = branchQuery.branchId;
    }

    if (filter?.dateStart || filter?.dateEnd) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filter?.dateStart) dateFilter.gte = new Date(filter.dateStart);
      if (filter?.dateEnd) dateFilter.lte = new Date(filter.dateEnd);
      where.transactionDate = dateFilter;
    }

    const transactions = await this.prisma.transactionSales.findMany({
      where,
      include: {
        masterMember: {
          select: {
            name: true,
            code: true,
            masterMemberCategory: {
              select: {
                name: true,
              },
            },
          },
        },
        transactionSalesItems: {
          include: {
            masterItem: {
              select: {
                name: true,
              },
            },
            masterItemVariant: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    const items: SalesReportItem[] = transactions.map((t) => {
      let totalNetProfit = 0;
      let totalGrossProfit = 0; // Revenue

      const salesItems = t.transactionSalesItems.map((item) => {
        const revenue = Number(item.recordedTotalAmount);
        const buyPricePerUnit =
          Number(item.recordedBuyPrice) * item.masterItemVariant.amount;
        const totalCost = buyPricePerUnit * item.qty;
        const netProfit = revenue - totalCost;

        totalNetProfit += netProfit;
        totalGrossProfit += revenue;

        return {
          itemName: item.masterItem.name,
          variantName: item.masterItemVariant.unit,
          qty: item.qty,
          price: Number(item.salesPrice),
          discount: Number(item.recordedDiscountAmount),
          total: Number(item.recordedTotalAmount), // Revenue
          grossProfit: revenue,
          netProfit: netProfit,
          buyPrice: buyPricePerUnit,
        };
      });

      return {
        id: t.id,
        transactionDate: t.transactionDate,
        invoiceNumber: t.invoiceNumber,
        memberName: t.masterMember
          ? `${t.masterMember.name} (${t.masterMember.code}) - ${t.masterMember.masterMemberCategory.name}`
          : "-",
        subTotal: Number(t.recordedSubTotalAmount),
        discount: Number(t.recordedDiscountAmount),
        totalAmount: Number(t.recordedTotalAmount),
        totalGrossProfit,
        totalNetProfit,
        items: salesItems,
      };
    });

    if (query?.exportAs === "pdf" || query?.exportAs === "preview") {
      const buffer = await this.pdfService.generateSalesReport(items);
      return {
        buffer,
        fileName: `sales-report-${new Date().getTime()}.pdf`,
        mimeType: "application/pdf",
      };
    } else {
      const buffer = await this.xlsxService.generateSalesReport(items);
      return {
        buffer,
        fileName: `sales-report-${new Date().getTime()}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
  };

  getSalesReturnReport = async (
    query: ReportQueryFilterType,
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Promise<ReportResult> => {
    const where: Prisma.TransactionSalesReturnWhereInput = {};
    where.deletedAt = null;

    if (branchQuery?.branchId) {
      where.branchId = branchQuery.branchId;
    }

    if (filter?.dateStart || filter?.dateEnd) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filter?.dateStart) dateFilter.gte = new Date(filter.dateStart);
      if (filter?.dateEnd) dateFilter.lte = new Date(filter.dateEnd);
      where.transactionDate = dateFilter;
    }

    const transactions = await this.prisma.transactionSalesReturn.findMany({
      where,
      include: {
        transactionSales: true, // For Invoice Ref
        transactionSalesReturnItems: {
          include: {
            masterItem: true,
            masterItemVariant: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    const items: SalesReturnReportItem[] = transactions.map((t) => ({
      id: t.id,
      transactionDate: t.transactionDate,
      returnNumber: t.returnNumber,
      invoiceNumberRef: t.transactionSales.invoiceNumber,
      subTotal: Number(t.recordedSubTotalAmount),
      discount: Number(t.recordedDiscountAmount),
      totalAmount: Number(t.recordedTotalAmount),

      items: t.transactionSalesReturnItems.map((item) => ({
        itemName: item.masterItem.name,
        variantName: item.masterItemVariant.unit,
        qty: item.qty,
        price: Number(item.salesPrice),
        discount: Number(item.recordedDiscountAmount),
        total: Number(item.recordedTotalAmount),
      })),
    }));

    if (query?.exportAs === "pdf" || query?.exportAs === "preview") {
      const buffer = await this.pdfService.generateSalesReturnReport(items);
      return {
        buffer,
        fileName: `sales-return-report-${new Date().getTime()}.pdf`,
        mimeType: "application/pdf",
      };
    } else {
      const buffer = await this.xlsxService.generateSalesReturnReport(items);
      return {
        buffer,
        fileName: `sales-return-report-${new Date().getTime()}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
  };

  getSellReport = async (
    query: ReportQueryFilterType,
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Promise<ReportResult> => {
    const where: Prisma.TransactionSellWhereInput = {};
    where.deletedAt = null;

    if (branchQuery?.branchId) {
      where.branchId = branchQuery.branchId;
    }

    if (filter?.dateStart || filter?.dateEnd) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filter?.dateStart) dateFilter.gte = new Date(filter.dateStart);
      if (filter?.dateEnd) dateFilter.lte = new Date(filter.dateEnd);
      where.transactionDate = dateFilter;
    }

    const transactions = await this.prisma.transactionSell.findMany({
      where,
      include: {
        masterMember: true, // Customer Name
        transactionSellItems: {
          include: {
            masterItem: {
              select: {
                name: true,
              },
            },
            masterItemVariant: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    const items: SellReportItem[] = transactions.map((t) => {
      let totalNetProfit = 0;
      let totalGrossProfit = 0;

      const sellItems = t.transactionSellItems.map((item) => {
        const revenue = Number(item.recordedTotalAmount);
        const buyPricePerUnit =
          Number(item.recordedBuyPrice) * item.masterItemVariant.amount;
        const totalCost = buyPricePerUnit * item.qty;
        const netProfit = revenue - totalCost;

        totalNetProfit += netProfit;
        totalGrossProfit += revenue;

        return {
          itemName: item.masterItem.name,
          variantName: item.masterItemVariant.unit,
          qty: item.qty,
          price: Number(item.sellPrice),
          discount: Number(item.recordedDiscountAmount),
          tax: 0, // Sell Items don't seem to have explicit recordedTaxAmount per item in schema shown, use header tax usually or calculate. Schema has recordedTaxAmount on header.
          total: Number(item.recordedTotalAmount),
          grossProfit: revenue,
          netProfit: netProfit,
          buyPrice: buyPricePerUnit,
        };
      });

      return {
        id: t.id,
        transactionDate: t.transactionDate,
        invoiceNumber: t.invoiceNumber,
        customerName: t.masterMember.name,
        subTotal: Number(t.recordedSubTotalAmount),
        discount: Number(t.recordedDiscountAmount),
        tax: Number(t.recordedTaxAmount),
        totalAmount: Number(t.recordedTotalAmount),
        totalGrossProfit,
        totalNetProfit,

        dueDate: t.dueDate,

        items: sellItems,
      };
    });

    if (query?.exportAs === "pdf" || query?.exportAs === "preview") {
      const buffer = await this.pdfService.generateSellReport(items);
      return {
        buffer,
        fileName: `sell-report-${new Date().getTime()}.pdf`,
        mimeType: "application/pdf",
      };
    } else {
      const buffer = await this.xlsxService.generateSellReport(items);
      return {
        buffer,
        fileName: `sell-report-${new Date().getTime()}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
  };

  getSellReturnReport = async (
    query: ReportQueryFilterType,
    filter?: FilterQueryType,
    branchQuery?: BranchQueryType,
  ): Promise<ReportResult> => {
    const where: Prisma.TransactionSellReturnWhereInput = {};
    where.deletedAt = null;

    if (branchQuery?.branchId) {
      where.branchId = branchQuery.branchId;
    }

    if (filter?.dateStart || filter?.dateEnd) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filter?.dateStart) dateFilter.gte = new Date(filter.dateStart);
      if (filter?.dateEnd) dateFilter.lte = new Date(filter.dateEnd);
      where.transactionDate = dateFilter;
    }

    const transactions = await this.prisma.transactionSellReturn.findMany({
      where,
      include: {
        masterMember: true, // Customer Name
        transactionSellReturnItems: {
          include: {
            masterItem: true,
            masterItemVariant: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    const items: SellReturnReportItem[] = transactions.map((t) => ({
      id: t.id,
      transactionDate: t.transactionDate,
      invoiceNumber: t.invoiceNumber, // Return Number
      customerName: t.masterMember.name,
      subTotal: Number(t.recordedSubTotalAmount),
      discount: Number(t.recordedDiscountAmount),
      tax: Number(t.recordedTaxAmount),
      totalAmount: Number(t.recordedTotalAmount),

      items: t.transactionSellReturnItems.map((item) => ({
        itemName: item.masterItem.name,
        variantName: item.masterItemVariant.unit,
        qty: item.qty,
        price: Number(item.sellPrice),
        discount: Number(item.recordedDiscountAmount),
        tax: 0, // Individual item tax not explicit in simple map
        total: Number(item.recordedTotalAmount),
      })),
    }));

    if (query?.exportAs === "pdf" || query?.exportAs === "preview") {
      const buffer = await this.pdfService.generateSellReturnReport(items);
      return {
        buffer,
        fileName: `sell-return-report-${new Date().getTime()}.pdf`,
        mimeType: "application/pdf",
      };
    } else {
      const buffer = await this.xlsxService.generateSellReturnReport(items);
      return {
        buffer,
        fileName: `sell-return-report-${new Date().getTime()}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
  };

  getItemReport = async (
    query: ReportQueryFilterType,
    branchQuery?: BranchQueryType,
  ): Promise<ReportResult> => {
    const where: Prisma.MasterItemWhereInput = {
      deletedAt: null,
      isActive: true,
    };

    const items = await this.prisma.masterItem.findMany({
      where,
      select: {
        name: true,
        code: true,
        recordedBuyPrice: true,
        masterItemCategory: {
          select: {
            name: true,
            code: true,
          },
        },
        masterSupplier: {
          select: {
            name: true,
            code: true,
          },
        },
        masterItemVariants: {
          where: { deletedAt: null },
          orderBy: { amount: "asc" },
          select: {
            unit: true,
            amount: true,
            recordedProfitAmount: true,
            recordedProfitPercentage: true,
            sellPrice: true,
          },
        },
        itemBranches: {
          where: { deletedAt: null, branchId: branchQuery?.branchId },
          select: {
            recordedStock: true,
            branchId: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const reportData: ItemReportItem[] = [];
    const targetBranchId = branchQuery?.branchId || null;

    items.forEach((item) => {
      let stock = 0;

      if (targetBranchId) {
        const branchStock = item.itemBranches.find(
          (ib) => ib.branchId === targetBranchId,
        );
        stock = branchStock?.recordedStock ?? 0;
      } else {
        stock = item.itemBranches.reduce(
          (acc, ib) => acc + ib.recordedStock,
          0,
        );
      }

      if (item.masterItemVariants.length === 0) return;

      item.masterItemVariants.forEach((variant, index) => {
        const isFirstVariant = index === 0;

        // Buy Price = Base Price * Amount (as per example PCS=3500, BOX=35000)
        const baseBuyPrice = Number(item.recordedBuyPrice);
        const variantBuyPrice = baseBuyPrice * variant.amount;

        reportData.push({
          code: item.code,
          name: item.name,
          stock: stock,
          category: item.masterItemCategory.code,
          supplier: item.masterSupplier.name,
          variantUnit: variant.unit,
          variantAmount: variant.amount,
          buyPrice: variantBuyPrice,
          profitPercentage: Number(variant.recordedProfitPercentage),
          profitAmount: Number(variant.recordedProfitAmount),
          sellPrice: Number(variant.sellPrice),
          isFirstVariant: isFirstVariant,
        });
      });
    });

    if (query?.exportAs === "pdf" || query?.exportAs === "preview") {
      const buffer = await this.pdfService.generateItemReport(reportData);
      return {
        buffer,
        fileName: `master-item-report-${new Date().getTime()}.pdf`,
        mimeType: "application/pdf",
      };
    } else {
      const buffer = await this.xlsxService.generateItemReport(reportData);
      return {
        buffer,
        fileName: `master-item-report-${new Date().getTime()}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
  };

  getMemberReport = async (
    query: ReportQueryFilterType,
    filter?: FilterQueryType,
  ): Promise<ReportResult> => {
    // Member Filter
    const memberWhere: Prisma.MasterMemberWhereInput = {
      deletedAt: null,
    };

    const categories = await this.prisma.masterMemberCategory.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        masterMembers: {
          where: memberWhere,
          orderBy: { name: "asc" },
        },
      },
      orderBy: { code: "asc" },
    });

    // Filter out categories with no members if filter is applied?
    // User requirement: "begitu diulang hingga data dari category member habis"
    // Usually reports don't show empty groups unless requested. Let's filter for cleaner report.
    const activeCategories = categories.filter(
      (c) => c.masterMembers.length > 0,
    );

    const reportData: MemberReportItem[] = activeCategories.map((c) => ({
      categoryCode: c.code,
      categoryName: c.name,
      members: c.masterMembers.map((m) => ({
        code: m.code,
        name: m.name,
        phone: m.phone || "-",
        email: m.email || "-",
        address: m.address || "-",
        createdAt: m.createdAt,
      })),
    }));

    if (query.exportAs === "pdf" || query.exportAs === "preview") {
      const buffer = await this.pdfService.generateMemberReport(reportData);
      return {
        buffer,
        fileName: `member-report-${new Date().getTime()}.pdf`,
        mimeType: "application/pdf",
      };
    } else {
      const buffer = await this.xlsxService.generateMemberReport(reportData);
      return {
        buffer,
        fileName: `member-report-${new Date().getTime()}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
  };
  getMemberPurchaseReport = async (
    query: ReportQueryFilterType,
    filter?: FilterQueryType,
  ): Promise<ReportResult> => {
    const whereDate: Prisma.DateTimeFilter = {};
    if (filter?.dateStart) whereDate.gte = new Date(filter.dateStart);
    if (filter?.dateEnd) whereDate.lte = new Date(filter.dateEnd);

    const hasDateFilter = filter?.dateStart || filter?.dateEnd;

    // 1. Get Sales Transactions (POS) with Members
    const salesTransactions = await this.prisma.transactionSales.findMany({
      where: {
        deletedAt: null,
        masterMemberId: { not: null },
        ...(hasDateFilter && { transactionDate: whereDate }),
      },
      include: {
        masterMember: {
          include: { masterMemberCategory: true },
        },
      },
    });

    // 2. Get Sell Transactions (B2B)
    const sellTransactions = await this.prisma.transactionSell.findMany({
      where: {
        deletedAt: null,
        ...(hasDateFilter && { transactionDate: whereDate }),
      },
      include: {
        masterMember: {
          include: { masterMemberCategory: true },
        },
      },
    });

    // 3. Aggregate Data
    const memberMap = new Map<
      number,
      {
        member: any; // Using any for simplicity as shapes match enough for aggregation info
        frequency: number;
        totalAmount: number;
      }
    >();

    const processTransaction = (t: any) => {
      const memberId = t.masterMemberId;
      if (!memberId) return;

      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, {
          member: t.masterMember,
          frequency: 0,
          totalAmount: 0,
        });
      }

      const entry = memberMap.get(memberId)!;
      entry.frequency += 1;
      entry.totalAmount += Number(t.recordedTotalAmount);
    };

    salesTransactions.forEach(processTransaction);
    sellTransactions.forEach(processTransaction);

    // 4. Transform to Report Items
    const reportData: MemberPurchaseReportItem[] = Array.from(
      memberMap.values(),
    ).map((entry) => ({
      code: entry.member.code,
      name: entry.member.name,
      category: entry.member.masterMemberCategory.name,
      phone: entry.member.phone || "-",
      email: entry.member.email || "-",
      totalPurchaseFrequency: entry.frequency,
      totalPurchaseAmount: entry.totalAmount,
    }));

    // Sort by Total Purchase Amount Descending
    reportData.sort((a, b) => b.totalPurchaseAmount - a.totalPurchaseAmount);

    if (query.exportAs === "pdf" || query.exportAs === "preview") {
      const buffer =
        await this.pdfService.generateMemberPurchaseReport(reportData);
      return {
        buffer,
        fileName: `member-purchase-report-${new Date().getTime()}.pdf`,
        mimeType: "application/pdf",
      };
    } else {
      const buffer =
        await this.xlsxService.generateMemberPurchaseReport(reportData);
      return {
        buffer,
        fileName: `member-purchase-report-${new Date().getTime()}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }
  };
}
