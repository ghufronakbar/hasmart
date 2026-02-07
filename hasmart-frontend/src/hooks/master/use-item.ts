"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { itemService } from "@/services/master/item.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import { CreateItemDTO, UpdateItemDTO } from "@/types/master/item";
import { FilterQuery } from "@/types/common";
import { useBranch } from "@/providers/branch-provider";

// --- Item Hooks ---

export function useItems(
  params?: FilterQuery & { idNotIns?: string; onlyActive?: boolean },
) {
  const { branch } = useBranch();
  return useQuery({
    queryKey: queryKeys.master.items.list({ ...params, branchId: branch?.id }),
    queryFn: () => itemService.list({ ...params, branchId: branch?.id }),
  });
}

export function useItem(id: number | null, params?: { branchId?: number }) {
  return useQuery({
    queryKey: queryKeys.master.items.detail(id ?? 0),
    queryFn: () => itemService.get(id!, params),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemDTO) => itemService.create(data),
    onSuccess: () => {
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateItemDTO }) =>
      itemService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.master.items.detail(variables.id),
      });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => itemService.delete(id),
    onSuccess: () => {
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

// --- Variant Hooks ---
// Deprecated: Variant operations are now handled via bulk update on item

export function useItemByCode(code: string | undefined) {
  return useQuery({
    queryKey: ["master", "item", "by-code", code],
    queryFn: () => itemService.getItemByCode(code!),
    enabled: !!code,
  });
}

export function useItemBulkUpdateVariantPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { masterItemVariants: number[]; sellPrice: number }) =>
      itemService.bulkUpdateVariantPrice(data),
    onSuccess: () => {
      invalidationMap.master.item().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
