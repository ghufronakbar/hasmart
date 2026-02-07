import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateMemberDTO,
  MemberListResponse,
  MemberResponse,
  UpdateMemberDTO,
} from "@/types/master/member";

export const memberService = {
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<MemberListResponse>(
      "/master/member",
      { params },
    );
    return response.data;
  },

  get: async (id: number | string) => {
    const response = await axiosInstance.get<MemberResponse>(
      `/master/member/${id}`,
    );
    return response.data;
  },

  getByCode: async (code: string) => {
    const response = await axiosInstance.get<MemberResponse>(
      `/master/member/${code}/code`,
    );
    return response.data;
  },

  create: async (data: CreateMemberDTO) => {
    const response = await axiosInstance.post<MemberResponse>(
      "/master/member",
      data,
    );
    return response.data;
  },

  update: async (id: number | string, data: UpdateMemberDTO) => {
    const response = await axiosInstance.put<MemberResponse>(
      `/master/member/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await axiosInstance.delete<MemberResponse>(
      `/master/member/${id}`,
    );
    return response.data;
  },
};
