"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memberCategoryService } from "@/services/master/member-category.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import {
  CreateMemberCategoryDTO,
  UpdateMemberCategoryDTO,
} from "@/types/master/member-category";
import { FilterQuery } from "@/types/common";

export function useMemberCategories(params?: FilterQuery) {
  return useQuery({
    queryKey: queryKeys.master.memberCategories.list(params),
    queryFn: () => memberCategoryService.list(params),
  });
}

export function useMemberCategory(id: number | null) {
  return useQuery({
    queryKey: queryKeys.master.memberCategories.detail(id ?? 0),
    queryFn: () => memberCategoryService.get(id!),
    enabled: !!id,
  });
}

export function useCreateMemberCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMemberCategoryDTO) =>
      memberCategoryService.create(data),
    onSuccess: () => {
      invalidationMap.master.memberCategory().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateMemberCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMemberCategoryDTO }) =>
      memberCategoryService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.master.memberCategory().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.master.memberCategories.detail(variables.id),
      });
    },
  });
}

export function useDeleteMemberCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => memberCategoryService.delete(id),
    onSuccess: () => {
      invalidationMap.master.memberCategory().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
