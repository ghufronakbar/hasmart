"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { labelService } from "@/services/report/label.service";

export function useLabel(masterItemIds: number[], onlyBaseUnit: boolean) {
  return useQuery({
    queryKey: queryKeys.report.label(masterItemIds, onlyBaseUnit),
    queryFn: () => labelService.get(masterItemIds, onlyBaseUnit),
    enabled: !!masterItemIds && masterItemIds.length > 0,
  });
}
