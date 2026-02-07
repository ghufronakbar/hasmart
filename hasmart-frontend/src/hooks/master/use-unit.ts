"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unitService } from "@/services/master/unit.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import { CreateUnitDTO, UpdateUnitDTO } from "@/types/master/unit";
import { FilterQuery } from "@/types/common";

export function useUnits(params?: FilterQuery) {
  return useQuery({
    queryKey: queryKeys.master.units.list(params),
    queryFn: () => unitService.list(params),
  });
}

export function useUnit(id: number | null) {
  return useQuery({
    queryKey: queryKeys.master.units.detail(id ?? 0),
    queryFn: () => unitService.get(id!),
    enabled: !!id,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUnitDTO) => unitService.create(data),
    onSuccess: () => {
      invalidationMap.master.unit().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUnitDTO }) =>
      unitService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.master.unit().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.master.units.detail(variables.id),
      });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => unitService.delete(id),
    onSuccess: () => {
      invalidationMap.master.unit().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
