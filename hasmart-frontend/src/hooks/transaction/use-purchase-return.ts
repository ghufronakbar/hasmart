"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purchaseReturnService } from "@/services/transaction/purchase-return.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import {
  CreatePurchaseReturnDTO,
  UpdatePurchaseReturnDTO,
  PurchaseReturnListResponse,
} from "@/types/transaction/purchase-return";
import { FilterQuery } from "@/types/common";
import { useBranch } from "@/providers/branch-provider";

// --- Purchase Return Hooks ---

export function usePurchaseReturns(params?: FilterQuery) {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };
  return useQuery<PurchaseReturnListResponse>({
    queryKey: queryKeys.transaction.purchaseReturn.list(p),
    queryFn: () => purchaseReturnService.list(p),
  });
}

export function usePurchaseReturn(id: number | null) {
  return useQuery({
    queryKey: queryKeys.transaction.purchaseReturn.detail(id ?? 0),
    queryFn: () => purchaseReturnService.get(id!),
    enabled: !!id,
  });
}

export function useCreatePurchaseReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseReturnDTO) =>
      purchaseReturnService.create(data),
    onSuccess: () => {
      invalidationMap.transaction.purchaseReturn().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Invalidate stock/item queries as return affects stock
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdatePurchaseReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdatePurchaseReturnDTO;
    }) => purchaseReturnService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.transaction.purchaseReturn().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transaction.purchaseReturn.detail(variables.id),
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useDeletePurchaseReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => purchaseReturnService.delete(id),
    onSuccess: () => {
      invalidationMap.transaction.purchaseReturn().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
