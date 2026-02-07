"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cashFlowService } from "@/services/transaction/cash-flow.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import {
  CreateCashFlowDTO,
  UpdateCashFlowDTO,
  CashFlowListResponse,
} from "@/types/transaction/cash-flow";
import { FilterQuery } from "@/types/common";
import { useBranch } from "@/providers/branch-provider";

export function useCashFlows(
  params?: FilterQuery,
  options?: { enabled?: boolean },
) {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };
  return useQuery<CashFlowListResponse>({
    queryKey: queryKeys.transaction.cashFlow.list(p),
    queryFn: () => cashFlowService.list(p),
    enabled: options?.enabled,
  });
}

export function useCashFlow(id: number | null) {
  return useQuery({
    queryKey: queryKeys.transaction.cashFlow.detail(id ?? 0),
    queryFn: () => cashFlowService.get(id!),
    enabled: !!id,
  });
}

export function useCreateCashFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCashFlowDTO) => cashFlowService.create(data),
    onSuccess: () => {
      invalidationMap.transaction.cashFlow().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateCashFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateCashFlowDTO;
    }) => cashFlowService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.transaction.cashFlow().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transaction.cashFlow.detail(variables.id),
      });
    },
  });
}

export function useDeleteCashFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => cashFlowService.delete(id),
    onSuccess: () => {
      invalidationMap.transaction.cashFlow().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
