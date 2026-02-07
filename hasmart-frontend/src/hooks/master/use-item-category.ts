"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { itemCategoryService } from "@/services/master/item-category.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import {
  CreateItemCategoryDTO,
  UpdateItemCategoryDTO,
} from "@/types/master/item-category";
import { FilterQuery } from "@/types/common";

export function useItemCategories(params?: FilterQuery) {
  return useQuery({
    queryKey: queryKeys.master.itemCategories.list(params),
    queryFn: () => itemCategoryService.list(params),
  });
}

export function useItemCategory(id: number | null) {
  return useQuery({
    queryKey: queryKeys.master.itemCategories.detail(id ?? 0),
    queryFn: () => itemCategoryService.get(id!),
    enabled: !!id,
  });
}

export function useCreateItemCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemCategoryDTO) =>
      itemCategoryService.create(data),
    onSuccess: () => {
      invalidationMap.master.itemCategory().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateItemCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateItemCategoryDTO }) =>
      itemCategoryService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.master.itemCategory().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.master.itemCategories.detail(variables.id),
      });
    },
  });
}

export function useDeleteItemCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => itemCategoryService.delete(id),
    onSuccess: () => {
      invalidationMap.master.itemCategory().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
