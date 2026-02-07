import { axiosInstance } from "@/lib/axios";
import { LabelResponse } from "@/types/report/label";

export const labelService = {
  get: async (masterItemIds: number[], onlyBaseUnit: boolean) => {
    const response = await axiosInstance.get<LabelResponse>(`/report/label`, {
      params: {
        masterItemIds: masterItemIds.join(","),
        onlyBaseUnit,
      },
    });
    return response.data;
  },
};
