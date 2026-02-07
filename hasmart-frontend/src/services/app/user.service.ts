import { axiosInstance } from "@/lib/axios";
import { FilterQuery } from "@/types/common";
import {
  CreateUserDTO,
  EditProfileDTO,
  ChangePasswordDTO,
  ResetPasswordDTO,
  UserListResponse,
  UserResponse,
  LoginDTO,
  LoginResponse,
  FirstTimeSetupDTO,
  UserStatusResponse,
  UpdateUserAccessDTO,
} from "@/types/app/user";

export const userService = {
  // Public: Check if system has users
  getStatus: async () => {
    const response =
      await axiosInstance.get<UserStatusResponse>("/app/user/status");
    return response.data;
  },

  // Public: First time setup (only works if no users exist)
  firstTimeSetup: async (data: FirstTimeSetupDTO) => {
    const response = await axiosInstance.post<LoginResponse>(
      "/app/user/first-time-setup",
      data,
    );
    return response.data;
  },

  login: async (data: LoginDTO) => {
    const response = await axiosInstance.post<LoginResponse>(
      "/app/user/login",
      data,
    );
    return response.data;
  },
  list: async (params?: FilterQuery) => {
    const response = await axiosInstance.get<UserListResponse>("/app/user", {
      params,
    });
    return response.data;
  },

  create: async (data: CreateUserDTO) => {
    const response = await axiosInstance.post<UserResponse>("/app/user", data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosInstance.delete<UserResponse>(
      `/app/user/${id}`,
    );
    return response.data;
  },

  resetPassword: async (id: number, data: ResetPasswordDTO) => {
    const response = await axiosInstance.post<UserResponse>(
      `/app/user/${id}/reset-password`,
      data,
    );
    return response.data;
  },

  me: async () => {
    const response = await axiosInstance.get<UserResponse>("/app/user/whoami");
    return response.data;
  },

  updateAccess: async (id: number, data: UpdateUserAccessDTO) => {
    const response = await axiosInstance.put<UserResponse>(
      `/app/user/${id}/access`,
      data,
    );
    return response.data;
  },

  updateProfile: async (data: EditProfileDTO) => {
    const response = await axiosInstance.put<UserResponse>("/app/user", data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDTO) => {
    const response = await axiosInstance.post<UserResponse>(
      "/app/user/change-password",
      data,
    );
    return response.data;
  },

  refreshToken: async (token: string) => {
    // We use a clean instance or fetch to avoid interceptor loops if we were using the same instance (though logic usually handles it).
    // But since the interceptor uses axiosInstance, we can use it here as long as we don't trigger 401s recursively.
    // The interceptor logic usually prevents this by not retrying the refresh endpoint itself.
    const response = await axiosInstance.post<{
      data: { accessToken: string };
    }>("/app/user/refresh", {
      refreshToken: token,
    });
    return response.data;
  },
};
