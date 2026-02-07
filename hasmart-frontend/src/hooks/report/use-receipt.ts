"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { receiptService } from "@/services/report/receipt.service";

export function useReceipt(type: string, receiptId: number | string) {
  return useQuery({
    queryKey: queryKeys.report.receipt(type, receiptId),
    queryFn: () => receiptService.get(type, receiptId),
    enabled: !!receiptId && !!type,
  });
}
