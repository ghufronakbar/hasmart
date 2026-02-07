"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { frontStockService } from "@/services/stock/front-stock.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import { CreateFrontStockTransferDTO } from "@/types/stock/front-stock";
import { FilterQuery } from "@/types/common";
import { useBranch } from "@/providers/branch-provider";

export function useFrontStockItems(params?: FilterQuery) {
  const { branch } = useBranch();
  return useQuery({
    queryKey: queryKeys.stock.frontStock.items.list({
      ...params,
      branchId: branch?.id,
    }),
    queryFn: () =>
      frontStockService.listItems({ ...params, branchId: branch?.id }),
    enabled: !!branch?.id,
  });
}

export function useFrontStockTransfers(
  params?: FilterQuery & { search?: string },
) {
  const { branch } = useBranch();
  return useQuery({
    queryKey: queryKeys.stock.frontStock.transfers.list({
      ...params,
      branchId: branch?.id,
    }),
    queryFn: () =>
      frontStockService.listTransfers({ ...params, branchId: branch?.id }),
    enabled: !!branch?.id,
  });
}

export function useCreateFrontStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFrontStockTransferDTO) =>
      frontStockService.createTransfer(data),
    onSuccess: () => {
      invalidationMap.stock.frontStock.items().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      invalidationMap.stock.frontStock.transfers().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useDeleteFrontStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => frontStockService.deleteTransfer(id),
    onSuccess: () => {
      invalidationMap.stock.frontStock.items().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      invalidationMap.stock.frontStock.transfers().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
