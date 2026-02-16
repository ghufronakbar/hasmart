"use client";

import { useQuery } from "@tanstack/react-query";
import { ledgerStockService } from "@/services/stock/ledger-stock.service";
import { queryKeys } from "@/constants/query-keys";
import { LedgerStockQuery } from "@/types/stock/ledger-stock";
import { useBranch } from "@/providers/branch-provider";

export function useLedgerStock(params?: LedgerStockQuery) {
  const { branch } = useBranch();
  return useQuery({
    queryKey: queryKeys.stock.ledgerStock.list({
      ...params,
      branchId: params?.branchId ?? branch?.id,
    }),
    queryFn: () =>
      ledgerStockService.list({
        ...params,
        branchId: params?.branchId ?? branch?.id,
      }),
    enabled: !!branch?.id,
  });
}
