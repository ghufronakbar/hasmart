import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { overviewService } from "@/services/overview/overview.service";
import { FilterQuery } from "@/types/common";
import { useBranch } from "@/providers/branch-provider";

export const useFinancialSummary = (params?: FilterQuery) => {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };

  return useQuery({
    queryKey: queryKeys.overview.financialSummary(p),
    queryFn: () => overviewService.getFinancialSummary(p),
  });
};

export const useSalesTrend = (params?: FilterQuery) => {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };

  return useQuery({
    queryKey: queryKeys.overview.salesTrend(p),
    queryFn: () => overviewService.getSalesTrend(p),
  });
};

export const useTopProducts = (params?: FilterQuery) => {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };

  return useQuery({
    queryKey: queryKeys.overview.topProducts(p),
    queryFn: () => overviewService.getTopProducts(p),
  });
};

export const useStockAlerts = (params?: FilterQuery) => {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };

  return useQuery({
    queryKey: queryKeys.overview.stockAlerts(p),
    queryFn: () => overviewService.getStockAlerts(p),
  });
};
