import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateUnitDTO,
  UnitListResponse,
  UnitResponse,
  UpdateUnitDTO,
} from "@/types/master/unit";

export const unitService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<UnitListResponse>("/master/unit", {
      params,
    });
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<UnitResponse>(
      `/master/unit/${id}`,
    );
    return response.data;
  },

  create: async (data: CreateUnitDTO) => {
    const response = await axiosInstance.post<UnitResponse>(
      "/master/unit",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateUnitDTO) => {
    const response = await axiosInstance.put<UnitResponse>(
      `/master/unit/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<UnitResponse>(
      `/master/unit/${id}`,
    );
    return response.data;
  },
};
