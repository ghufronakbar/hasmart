"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesService } from "@/services/transaction/sales.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import {
  CreateSalesDTO,
  UpdateSalesDTO,
  SalesListResponse,
} from "@/types/transaction/sales";
import { FilterQuery } from "@/types/common";
import { useBranch } from "@/providers/branch-provider";

// --- Sales Hooks ---

export function useSalesList(params?: FilterQuery) {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };
  return useQuery<SalesListResponse>({
    queryKey: queryKeys.transaction.sales.list(p),
    queryFn: () => salesService.list(p),
  });
}

export function useSales(id: number | null) {
  return useQuery({
    queryKey: queryKeys.transaction.sales.detail(id ?? 0),
    queryFn: () => salesService.get(id!),
    enabled: !!id,
  });
}

export function useSalesByInvoice(invoiceNumber: string) {
  return useQuery({
    queryKey: queryKeys.transaction.sales.byInvoice(invoiceNumber),
    queryFn: () => salesService.getByInvoice(invoiceNumber),
    enabled: !!invoiceNumber,
    retry: 0,
  });
}

export function useCreateSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesDTO) => salesService.create(data),
    onSuccess: () => {
      invalidationMap.transaction.sales().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Sales decreases stock, invalidate items
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.master.items.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.frontStock.items.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.frontStock.items.list(),
      });
    },
  });
}

export function useUpdateSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateSalesDTO }) =>
      salesService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.transaction.sales().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transaction.sales.detail(variables.id),
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.master.items.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.frontStock.items.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.frontStock.items.list(),
      });
    },
  });
}

export function useDeleteSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => salesService.delete(id),
    onSuccess: () => {
      invalidationMap.transaction.sales().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      // Invalidate items for stock refresh
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.master.items.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.frontStock.items.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.frontStock.items.list(),
      });
    },
  });
}
