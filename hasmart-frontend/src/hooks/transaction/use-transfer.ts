"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transferService } from "@/services/transaction/transfer.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import {
  CreateTransferDTO,
  UpdateTransferDTO,
  TransferListResponse,
} from "@/types/transaction/transfer";
import { FilterQuery } from "@/types/common";
import { useBranch } from "@/providers/branch-provider";

// --- Transfer Hooks ---

export function useTransfers(params?: FilterQuery) {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };
  return useQuery<TransferListResponse>({
    queryKey: queryKeys.transaction.transfers.list(p),
    queryFn: () => transferService.list(p),
  });
}

export function useTransfer(id: number | null) {
  return useQuery({
    queryKey: queryKeys.transaction.transfers.detail(id ?? 0),
    queryFn: () => transferService.get(id!),
    enabled: !!id,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransferDTO) => transferService.create(data),
    onSuccess: () => {
      invalidationMap.transaction.transfer().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateTransferDTO;
    }) => transferService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.transaction.transfer().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transaction.transfers.detail(variables.id),
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => transferService.delete(id),
    onSuccess: () => {
      invalidationMap.transaction.transfer().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
