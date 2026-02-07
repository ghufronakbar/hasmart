"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesReturnService } from "@/services/transaction/sales-return.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import {
  CreateSalesReturnDTO,
  UpdateSalesReturnDTO,
  SalesReturnListResponse,
} from "@/types/transaction/sales-return";
import { FilterQuery } from "@/types/common";
import { useBranch } from "@/providers/branch-provider";

// --- Sales Return Hooks ---

export function useSalesReturns(params?: FilterQuery) {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };
  return useQuery<SalesReturnListResponse>({
    queryKey: queryKeys.transaction.salesReturn.list(p),
    queryFn: () => salesReturnService.list(p),
  });
}

export function useSalesReturn(id: number | null) {
  return useQuery({
    queryKey: queryKeys.transaction.salesReturn.detail(id ?? 0),
    queryFn: () => salesReturnService.get(id!),
    enabled: !!id,
  });
}

export function useCreateSalesReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesReturnDTO) => salesReturnService.create(data),
    onSuccess: () => {
      invalidationMap.transaction.salesReturn().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Sales Return increases stock, invalidate items
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateSalesReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateSalesReturnDTO;
    }) => salesReturnService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.transaction.salesReturn().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transaction.salesReturn.detail(variables.id),
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useDeleteSalesReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => salesReturnService.delete(id),
    onSuccess: () => {
      invalidationMap.transaction.salesReturn().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
