import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { adjustStockService } from "@/services/transaction/adjust-stock.service";
import { FilterQuery } from "@/types/common";
import { toast } from "sonner";
import { CreateTransactionAdjustmentDTO } from "@/types/transaction/adjust-stock";

import { AxiosError } from "axios";
import { useBranch } from "@/providers/branch-provider";

export const useAdjustStocks = (params?: FilterQuery) => {
  const { branch } = useBranch();
  const p = { ...params, branchId: branch?.id };
  return useQuery({
    queryKey: queryKeys.transaction.adjustStock.list(p),
    queryFn: () => adjustStockService.list(p),
  });
};

export const useAdjustStock = (id: number | null) => {
  return useQuery({
    queryKey: queryKeys.transaction.adjustStock.detail(id!),
    queryFn: () => adjustStockService.getById(id!),
    enabled: !!id,
  });
};

export const useCreateAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionAdjustmentDTO) =>
      adjustStockService.create(data),
    onSuccess: () => {
      toast.success("Stock Opname berhasil disimpan");
      queryClient.invalidateQueries({
        queryKey: queryKeys.transaction.adjustStock.all,
      });
      // Also invalidate items to reflect stock changes
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
    onError: (error: AxiosError<{ errors?: { message: string } }>) => {
      toast.error(
        error.response?.data?.errors?.message || "Gagal menyimpan stock opname",
      );
    },
  });
};

export const useDeleteAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adjustStockService.delete(id),
    onSuccess: () => {
      toast.success("Adjustment berhasil dihapus");
      queryClient.invalidateQueries({
        queryKey: queryKeys.transaction.adjustStock.all,
      });
      // Also invalidate items
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
    onError: (error: AxiosError<{ errors?: { message: string } }>) => {
      toast.error(
        error.response?.data?.errors?.message || "Gagal menghapus adjustment",
      );
    },
  });
};
