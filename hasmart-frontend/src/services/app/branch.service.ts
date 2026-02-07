import { axiosInstance } from "@/lib/axios";
import {
  BranchListResponse,
  BranchResponse,
  CreateBranchDTO,
  UpdateBranchDTO,
} from "@/types/app/branch";
import { FilterQuery } from "@/types/common";

export const branchService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<BranchListResponse>(
      "/app/branch",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<BranchResponse>(
      `/app/branch/${id}`,
    );
    return response.data;
  },

  create: async (data: CreateBranchDTO) => {
    const response = await axiosInstance.post<BranchResponse>(
      "/app/branch",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateBranchDTO) => {
    const response = await axiosInstance.put<BranchResponse>(
      `/app/branch/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<BranchResponse>(
      `/app/branch/${id}`,
    );
    return response.data;
  },
};
