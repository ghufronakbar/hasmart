"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "@/services/master/supplier.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import { CreateSupplierDTO, UpdateSupplierDTO } from "@/types/master/supplier";
import { FilterQuery } from "@/types/common";

export function useSuppliers(params?: FilterQuery) {
  return useQuery({
    queryKey: queryKeys.master.suppliers.list(params),
    queryFn: () => supplierService.list(params),
  });
}

export function useSupplier(id: number | null) {
  return useQuery({
    queryKey: queryKeys.master.suppliers.detail(id ?? 0),
    queryFn: () => supplierService.get(id!),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierDTO) => supplierService.create(data),
    onSuccess: () => {
      invalidationMap.master.supplier().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSupplierDTO }) =>
      supplierService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.master.supplier().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.master.suppliers.detail(variables.id),
      });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => supplierService.delete(id),
    onSuccess: () => {
      invalidationMap.master.supplier().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
