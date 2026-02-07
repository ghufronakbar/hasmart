import { BaseService } from "../../../base/base-service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { BadRequestError, NotFoundError } from "../../../utils/error";
import {
  RecordActionModelType,
  RecordActionType,
  SalesPaymentType,
  TransactionCashFlowType,
} from ".prisma/client";
import { ReceiptData, SalesReceipt } from "./receipt.interface";
import { ReceiptParamsType, SalesReceiptQueryType } from "./receipt.validator";
import { Decimal } from "@prisma/client/runtime/library";

export class ReceiptService extends BaseService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  getReceipt = async (data: ReceiptParamsType): Promise<ReceiptData> => {
    switch (data.type) {
      case "sales":
        return this.getSalesReceipt(data.receiptId);
      case "sell":
        return this.getSellReceipt(data.receiptId);
      default:
        throw new BadRequestError("Tipe transaksi tidak ditemukan");
    }
  };

  getSalesReceipt = async (receiptId: number): Promise<ReceiptData> => {
    const [receipt, track] = await Promise.all([
      this.prisma.transactionSales.findUnique({
        where: { id: receiptId },
        select: {
          deletedAt: true,
          invoiceNumber: true,
          recordedDiscountAmount: true,
          recordedSubTotalAmount: true,
          recordedTotalAmount: true,
          transactionDate: true,
          cashReceived: true,
          cashChange: true,
          transactionSalesItems: {
            select: {
              recordedDiscountAmount: true,
              recordedSubTotalAmount: true,
              recordedTotalAmount: true,
              qty: true,
              masterItem: {
                select: {
                  name: true,
                },
              },
              masterItemVariant: {
                select: {
                  unit: true,
                },
              },
            },
          },
          branch: {
            select: {
              name: true,
              address: true,
              phone: true,
            },
          },
          masterMember: {
            select: {
              name: true,
              phone: true,
              masterMemberCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.recordAction.findFirst({
        where: {
          modelId: receiptId,
          modelType: RecordActionModelType.TRANSACTION_SALES,
          actionType: RecordActionType.CREATE,
        },
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);
    if (!receipt || receipt.deletedAt) {
      throw new NotFoundError();
    }

    return {
      address: receipt.branch.address || "",
      cashierName: track?.user?.name || "",
      customerName: receipt.masterMember
        ? `${receipt.masterMember.name} (${receipt.masterMember.masterMemberCategory.name})`
        : "",
      invoiceNumber: receipt.invoiceNumber,
      phone: receipt.branch.phone || "",
      storeName: receipt.branch.name,
      items: receipt.transactionSalesItems.map((item) => ({
        name: item.masterItem.name,
        discount: item.recordedDiscountAmount.toString(),
        price: item.recordedSubTotalAmount.toString(),
        qty: item.qty,
        total: item.recordedTotalAmount.toString(),
        unit: item.masterItemVariant.unit,
      })),
      globalDiscount: receipt.recordedDiscountAmount.toString(),
      tax: "0",
      showTax: false,
      subTotal: receipt.recordedSubTotalAmount.toString(),
      totalAmount: receipt.recordedTotalAmount.toString(),
      payAmount: receipt.cashReceived.toString(),
      changeAmount: receipt.cashChange.toString(),
      transactionDate: receipt.transactionDate,
    };
  };

  getSellReceipt = async (receiptId: number): Promise<ReceiptData> => {
    const [receipt, track] = await Promise.all([
      this.prisma.transactionSell.findUnique({
        where: { id: receiptId },
        select: {
          deletedAt: true,
          invoiceNumber: true,
          recordedDiscountAmount: true,
          recordedSubTotalAmount: true,
          recordedTotalAmount: true,
          transactionDate: true,
          recordedTaxAmount: true,
          transactionSellItems: {
            select: {
              recordedDiscountAmount: true,
              recordedSubTotalAmount: true,
              recordedTotalAmount: true,
              qty: true,
              masterItem: {
                select: {
                  name: true,
                },
              },
              masterItemVariant: {
                select: {
                  unit: true,
                },
              },
            },
          },
          branch: {
            select: {
              name: true,
              address: true,
              phone: true,
            },
          },
          masterMember: {
            select: {
              name: true,
              phone: true,
              masterMemberCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.recordAction.findFirst({
        where: {
          modelId: receiptId,
          modelType: RecordActionModelType.TRANSACTION_SELL,
          actionType: RecordActionType.CREATE,
        },
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);
    if (!receipt || receipt.deletedAt) {
      throw new NotFoundError();
    }

    return {
      address: receipt.branch.address || "",
      cashierName: track?.user?.name || "",
      customerName: receipt.masterMember
        ? `${receipt.masterMember.name} (${receipt.masterMember.masterMemberCategory.name})`
        : "",
      invoiceNumber: receipt.invoiceNumber,
      phone: receipt.branch.phone || "",
      storeName: receipt.branch.name,
      items: receipt.transactionSellItems.map((item) => ({
        name: item.masterItem.name,
        discount: item.recordedDiscountAmount.toString(),
        price: item.recordedSubTotalAmount.toString(),
        qty: item.qty,
        total: item.recordedTotalAmount.toString(),
        unit: item.masterItemVariant.unit,
      })),
      globalDiscount: receipt.recordedDiscountAmount.toString(),
      tax: receipt.recordedTaxAmount.toString(),
      showTax: true,
      subTotal: receipt.recordedSubTotalAmount.toString(),
      totalAmount: receipt.recordedTotalAmount.toString(),
      payAmount: receipt.recordedTotalAmount.toString(),
      // NOTE: expected uang pas karena b2b
      changeAmount: "0",
      transactionDate: receipt.transactionDate,
    };
  };

  getSalesReceiptByDate = async (
    params: SalesReceiptQueryType,
    userId: number,
  ): Promise<SalesReceipt> => {
    // 1. Define Date Range (Full Day)
    const startDate = new Date(params.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    // 2. Fetch Data in Parallel
    const [branch, cashier, salesActions, returnActions, cashFlowActions] =
      await Promise.all([
        this.prisma.branch.findFirst({
          where: { id: params.branchId },
        }),
        this.prisma.user.findFirst({
          where: { id: userId },
          select: {
            name: true,
          },
        }),
        this.prisma.recordAction.findMany({
          where: {
            userId: userId,
            modelType: RecordActionModelType.TRANSACTION_SALES,
            actionType: RecordActionType.CREATE,
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          select: { modelId: true },
        }),
        this.prisma.recordAction.findMany({
          where: {
            userId: userId,
            modelType: RecordActionModelType.TRANSACTION_SALES_RETURN,
            actionType: RecordActionType.CREATE,
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          select: { modelId: true },
        }),
        this.prisma.recordAction.findMany({
          where: {
            userId: userId,
            modelType: RecordActionModelType.TRANSACTION_CASH_FLOW,
            actionType: RecordActionType.CREATE,
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          select: { modelId: true },
        }),
      ]);

    if (!branch) throw new NotFoundError("Cabang tidak ditemukan");
    if (!cashier) throw new NotFoundError("User tidak ditemukan");

    // 3. Fetch Transactions based on IDs
    const salesIds = salesActions.map((a) => a.modelId);
    const returnIds = returnActions.map((a) => a.modelId);
    const cashFlowIds = cashFlowActions.map((a) => a.modelId);

    const [salesTransactions, returnTransactions, cashFlowTransactions] =
      await Promise.all([
        this.prisma.transactionSales.findMany({
          where: {
            id: { in: salesIds },
            branchId: params.branchId,
            deletedAt: null,
          },
          select: {
            id: true,
            recordedTotalAmount: true,
            paymentType: true,
          },
        }),
        this.prisma.transactionSalesReturn.findMany({
          where: {
            id: { in: returnIds },
            branchId: params.branchId,
            deletedAt: null,
          },
          select: {
            id: true,
            recordedTotalAmount: true,
          },
        }),
        this.prisma.transactionCashFlow.findMany({
          where: {
            id: { in: cashFlowIds },
            branchId: params.branchId,
            deletedAt: null,
          },
          select: {
            id: true,
            amount: true,
            type: true,
          },
        }),
      ]);

    // 4. Aggregate Sales Data
    let totalTransaction = 0;
    let totalAmount = new Decimal(0);
    const paymentTypeSummary: Record<SalesPaymentType, Decimal> = {
      CASH: new Decimal(0),
      DEBIT: new Decimal(0),
      QRIS: new Decimal(0),
    };

    salesTransactions.forEach((t) => {
      totalTransaction++;
      const amount = t.recordedTotalAmount;

      totalAmount = totalAmount.add(amount);

      const type = t.paymentType || SalesPaymentType.CASH;
      if (!paymentTypeSummary[type]) {
        paymentTypeSummary[type] = new Decimal(0);
      }
      paymentTypeSummary[type] = paymentTypeSummary[type].add(amount);
    });

    // 5. Aggregate Return Data
    let totalReturn = new Decimal(0);
    returnTransactions.forEach((t) => {
      totalReturn = totalReturn.add(t.recordedTotalAmount);
    });

    // 6. Calculate Finals
    const cashIncome = paymentTypeSummary[SalesPaymentType.CASH];
    const balance = cashIncome.sub(totalReturn);

    // 7. Aggregate Cash Flow Data
    let cashFlowIn = new Decimal(0);
    let cashFlowOut = new Decimal(0);
    cashFlowTransactions.forEach((t) => {
      if (t.type === TransactionCashFlowType.IN) {
        cashFlowIn = cashFlowIn.add(t.amount);
      } else {
        cashFlowOut = cashFlowOut.add(t.amount);
      }
    });

    return {
      branch,
      date: startDate,
      cashierName: cashier.name,
      totalTransaction,
      totalAmount: totalAmount.toString(),
      totalReturn: totalReturn.toString(),
      cashFlowIn: cashFlowIn.toString(),
      cashFlowOut: cashFlowOut.toString(),
      paymentType: {
        CASH: paymentTypeSummary.CASH.toString(),
        DEBIT: paymentTypeSummary.DEBIT.toString(),
        QRIS: paymentTypeSummary.QRIS.toString(),
      },
      cashIncome: cashIncome.toString(),
      balance: balance.toString(),
    };
  };
}
