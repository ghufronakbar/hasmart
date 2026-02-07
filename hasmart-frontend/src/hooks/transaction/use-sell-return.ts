"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellReturnService } from "@/services/transaction/sell-return.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import {
  CreateSellReturnDTO,
  UpdateSellReturnDTO,
  SellReturnListResponse,
} from "@/types/transaction/sell-return";
import { FilterQuery } from "@/types/common";
import { useBranch } from "@/providers/branch-provider";

// --- Sell Return Hooks ---

export function useSellReturns(params?: FilterQuery) {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };
  return useQuery<SellReturnListResponse>({
    queryKey: queryKeys.transaction.sellReturn.list(p),
    queryFn: () => sellReturnService.list(p),
  });
}

export function useSellReturn(id: number | null) {
  return useQuery({
    queryKey: queryKeys.transaction.sellReturn.detail(id ?? 0),
    queryFn: () => sellReturnService.get(id!),
    enabled: !!id,
  });
}

export function useCreateSellReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSellReturnDTO) => sellReturnService.create(data),
    onSuccess: () => {
      invalidationMap.transaction.sellReturn().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Sell Return increases stock, invalidate items
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateSellReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateSellReturnDTO;
    }) => sellReturnService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.transaction.sellReturn().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transaction.sellReturn.detail(variables.id),
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useDeleteSellReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => sellReturnService.delete(id),
    onSuccess: () => {
      invalidationMap.transaction.sellReturn().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
