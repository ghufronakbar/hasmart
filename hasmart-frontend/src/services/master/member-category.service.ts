import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateMemberCategoryDTO,
  MemberCategoryListResponse,
  MemberCategoryResponse,
  UpdateMemberCategoryDTO,
} from "@/types/master/member-category";

export const memberCategoryService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<MemberCategoryListResponse>(
      "/master/member-category",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<MemberCategoryResponse>(
      `/master/member-category/${id}`,
    );
    return response.data;
  },

  create: async (data: CreateMemberCategoryDTO) => {
    const response = await axiosInstance.post<MemberCategoryResponse>(
      "/master/member-category",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateMemberCategoryDTO) => {
    const response = await axiosInstance.put<MemberCategoryResponse>(
      `/master/member-category/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<MemberCategoryResponse>(
      `/master/member-category/${id}`,
    );
    return response.data;
  },
};
