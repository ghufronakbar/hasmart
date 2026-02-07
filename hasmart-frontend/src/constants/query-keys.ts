export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
  },
  app: {
    branch: {
      all: ["app", "branch"] as const,
      list: (params?: unknown) =>
        [...queryKeys.app.branch.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.app.branch.all, "detail", id] as const,
    },
    user: {
      all: ["app", "user"] as const,
      status: () => [...queryKeys.app.user.all, "status"] as const,
      list: (params?: unknown) =>
        [...queryKeys.app.user.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.app.user.all, "detail", id] as const,
    },
  },
  master: {
    items: {
      all: ["master", "items"] as const,
      list: (params?: unknown) =>
        [...queryKeys.master.items.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.master.items.all, "detail", id] as const,
    },
    itemCategories: {
      all: ["master", "item-categories"] as const,
      list: (params?: unknown) =>
        [...queryKeys.master.itemCategories.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.master.itemCategories.all, "detail", id] as const,
    },
    members: {
      all: ["master", "members"] as const,
      list: (params?: unknown) =>
        [...queryKeys.master.members.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.master.members.all, "detail", id] as const,
      byCode: (code: string) =>
        [...queryKeys.master.members.all, "byCode", code] as const,
    },
    memberCategories: {
      all: ["master", "member-categories"] as const,
      list: (params?: unknown) =>
        [...queryKeys.master.memberCategories.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.master.memberCategories.all, "detail", id] as const,
      byCode: (code: string) =>
        [...queryKeys.master.memberCategories.all, "byCode", code] as const,
    },
    suppliers: {
      all: ["master", "suppliers"] as const,
      list: (params?: unknown) =>
        [...queryKeys.master.suppliers.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.master.suppliers.all, "detail", id] as const,
    },
    units: {
      all: ["master", "units"] as const,
      list: (params?: unknown) =>
        [...queryKeys.master.units.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.master.units.all, "detail", id] as const,
    },
  },
  transaction: {
    adjustStock: {
      all: ["transaction", "adjust-stock"] as const,
      list: (params?: unknown) =>
        [...queryKeys.transaction.adjustStock.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.transaction.adjustStock.all, "detail", id] as const,
    },
    purchase: {
      all: ["transaction", "purchase"] as const,
      list: (params?: unknown) =>
        [...queryKeys.transaction.purchase.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.transaction.purchase.all, "detail", id] as const,
      byInvoice: (invoiceNumber: string) =>
        [
          ...queryKeys.transaction.purchase.all,
          "byInvoice",
          invoiceNumber,
        ] as const,
    },
    purchaseReturn: {
      all: ["transaction", "purchase-return"] as const,
      list: (params?: unknown) =>
        [...queryKeys.transaction.purchaseReturn.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.transaction.purchaseReturn.all, "detail", id] as const,
    },
    sales: {
      all: ["transaction", "sales"] as const,
      list: (params?: unknown) =>
        [...queryKeys.transaction.sales.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.transaction.sales.all, "detail", id] as const,
      byInvoice: (invoiceNumber: string) =>
        [
          ...queryKeys.transaction.sales.all,
          "byInvoice",
          invoiceNumber,
        ] as const,
    },
    salesReturn: {
      all: ["transaction", "sales-return"] as const,
      list: (params?: unknown) =>
        [...queryKeys.transaction.salesReturn.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.transaction.salesReturn.all, "detail", id] as const,
    },
    sell: {
      all: ["transaction", "sell"] as const,
      list: (params?: unknown) =>
        [...queryKeys.transaction.sell.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.transaction.sell.all, "detail", id] as const,
      byInvoice: (invoiceNumber: string) =>
        [
          ...queryKeys.transaction.sell.all,
          "byInvoice",
          invoiceNumber,
        ] as const,
    },
    sellReturn: {
      all: ["transaction", "sell-return"] as const,
      list: (params?: unknown) =>
        [...queryKeys.transaction.sellReturn.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.transaction.sellReturn.all, "detail", id] as const,
    },
    transfers: {
      all: ["transaction", "transfers"] as const,
      list: (params?: unknown) =>
        [...queryKeys.transaction.transfers.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.transaction.transfers.all, "detail", id] as const,
    },
    cashFlow: {
      all: ["transaction", "cash-flow"] as const,
      list: (params?: unknown) =>
        [...queryKeys.transaction.cashFlow.all, "list", params] as const,
      detail: (id: number | string) =>
        [...queryKeys.transaction.cashFlow.all, "detail", id] as const,
    },
  },
  overview: {
    all: ["overview"] as const,
    financialSummary: (params?: unknown) =>
      [...queryKeys.overview.all, "financial-summary", params] as const,
    salesTrend: (params?: unknown) =>
      [...queryKeys.overview.all, "sales-trend", params] as const,
    topProducts: (params?: unknown) =>
      [...queryKeys.overview.all, "top-products", params] as const,
    stockAlerts: (params?: unknown) =>
      [...queryKeys.overview.all, "stock-alerts", params] as const,
  },
  report: {
    all: ["report"] as const,
    receipt: (type: string, receiptId: number | string) =>
      [...queryKeys.report.all, "receipt", type, receiptId] as const,
    label: (masterItemVariantIds: number[], onlyBaseUnit: boolean) =>
      [
        ...queryKeys.report.all,
        "label",
        masterItemVariantIds,
        onlyBaseUnit,
      ] as const,
  },
  stock: {
    frontStock: {
      items: {
        all: ["stock", "front-stock", "items"] as const,
        list: (params?: unknown) =>
          [...queryKeys.stock.frontStock.items.all, "list", params] as const,
      },
      transfers: {
        all: ["stock", "front-stock", "transfers"] as const,
        list: (params?: unknown) =>
          [
            ...queryKeys.stock.frontStock.transfers.all,
            "list",
            params,
          ] as const,
        detail: (id: number | string) =>
          [...queryKeys.stock.frontStock.transfers.all, "detail", id] as const,
      },
    },
  },
};

export const invalidationMap = {
  // Helper to get invalidation keys
  app: {
    branch: () => [queryKeys.app.branch.all],
    user: () => [queryKeys.app.user.all],
  },
  master: {
    item: () => [queryKeys.master.items.all],
    itemCategory: () => [queryKeys.master.itemCategories.all],
    member: () => [queryKeys.master.members.all],
    memberCategory: () => [queryKeys.master.memberCategories.all],
    supplier: () => [queryKeys.master.suppliers.all],
    unit: () => [queryKeys.master.units.all],
  },
  transaction: {
    adjustStock: () => [queryKeys.transaction.adjustStock.all],
    purchase: () => [queryKeys.transaction.purchase.all],
    purchaseReturn: () => [queryKeys.transaction.purchaseReturn.all],
    sales: () => [queryKeys.transaction.sales.all],
    salesReturn: () => [queryKeys.transaction.salesReturn.all],
    sell: () => [queryKeys.transaction.sell.all],
    sellReturn: () => [queryKeys.transaction.sellReturn.all],
    transfer: () => [queryKeys.transaction.transfers.all],
    cashFlow: () => [queryKeys.transaction.cashFlow.all],
  },
  stock: {
    frontStock: {
      items: () => [queryKeys.stock.frontStock.items.all],
      transfers: () => [queryKeys.stock.frontStock.transfers.all],
    },
  },
};
