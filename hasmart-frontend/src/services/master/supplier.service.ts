import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateSupplierDTO,
  SupplierListResponse,
  SupplierResponse,
  UpdateSupplierDTO,
} from "@/types/master/supplier";

export const supplierService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<SupplierListResponse>(
      "/master/supplier",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<SupplierResponse>(
      `/master/supplier/${id}`,
    );
    return response.data;
  },

  create: async (data: CreateSupplierDTO) => {
    const response = await axiosInstance.post<SupplierResponse>(
      "/master/supplier",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateSupplierDTO) => {
    const response = await axiosInstance.put<SupplierResponse>(
      `/master/supplier/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<SupplierResponse>(
      `/master/supplier/${id}`,
    );
    return response.data;
  },
};
