"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/app/user.service";
import { queryKeys } from "@/constants/query-keys";
import {
  CreateUserDTO,
  ResetPasswordDTO,
  EditProfileDTO,
  ChangePasswordDTO,
  UpdateUserAccessDTO,
} from "@/types/app/user";
import { FilterQuery } from "@/types/common";

// --- User Hooks ---

export function useUsers(params?: FilterQuery) {
  return useQuery({
    queryKey: [...queryKeys.app.user.all, "list", params], // Ensure query key consistency
    queryFn: () => userService.list(params),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDTO) => userService.create(data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.app.user.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.app.user.all });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ResetPasswordDTO }) =>
      userService.resetPassword(id, data),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: [...queryKeys.app.user.all, "profile"],
    queryFn: () => userService.me(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EditProfileDTO) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.app.user.all, "profile"],
      });
      // Also invalidate auth user query if it's separate, but usually auth uses profile
      queryClient.invalidateQueries({ queryKey: queryKeys.app.user.all });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordDTO) => userService.changePassword(data),
  });
}

export function useUpdateUserAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserAccessDTO }) =>
      userService.updateAccess(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.app.user.all });
    },
  });
}

// --- First Time Setup Hooks ---

export function useUserStatus() {
  return useQuery({
    queryKey: [...queryKeys.app.user.all, "status"],
    queryFn: () => userService.getStatus(),
    staleTime: 0, // Always check fresh
    retry: false,
  });
}

export function useFirstTimeSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; password: string }) =>
      userService.firstTimeSetup(data),
    onSuccess: (data) => {
      // Store the token
      if (data.data?.accessToken) {
        localStorage.setItem("token", data.data.accessToken);
      }
      // Invalidate user status and profile queries
      queryClient.invalidateQueries({ queryKey: queryKeys.app.user.all });
    },
  });
}
