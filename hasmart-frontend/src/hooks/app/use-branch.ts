"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { branchService } from "@/services/app/branch.service";
import { queryKeys } from "@/constants/query-keys";
import { invalidationMap } from "@/constants/query-keys";
import { CreateBranchDTO, UpdateBranchDTO } from "@/types/app/branch";
import { FilterQuery } from "@/types/common";

export function useBranches(params?: FilterQuery) {
  return useQuery({
    queryKey: queryKeys.app.branch.list(params),
    queryFn: () => branchService.list(params),
  });
}

export function useBranchDetail(id: number | null) {
  return useQuery({
    queryKey: queryKeys.app.branch.detail(id ?? 0),
    queryFn: () => branchService.get(id!),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBranchDTO) => branchService.create(data),
    onSuccess: () => {
      invalidationMap.app.branch().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBranchDTO }) =>
      branchService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate list and detail
      invalidationMap.app.branch().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.app.branch.detail(variables.id),
      });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => branchService.delete(id),
    onSuccess: () => {
      invalidationMap.app.branch().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
