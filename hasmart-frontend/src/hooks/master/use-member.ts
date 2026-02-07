"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memberService } from "@/services/master/member.service";
import { queryKeys, invalidationMap } from "@/constants/query-keys";
import { CreateMemberDTO, UpdateMemberDTO } from "@/types/master/member";
import { FilterQuery } from "@/types/common";

export function useMembers(params?: FilterQuery) {
  return useQuery({
    queryKey: queryKeys.master.members.list(params),
    queryFn: () => memberService.list(params),
  });
}

export function useMember(id: number | null) {
  return useQuery({
    queryKey: queryKeys.master.members.detail(id ?? 0),
    queryFn: () => memberService.get(id!),
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMemberDTO) => memberService.create(data),
    onSuccess: () => {
      invalidationMap.master.member().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMemberDTO }) =>
      memberService.update(id, data),
    onSuccess: (_, variables) => {
      invalidationMap.master.member().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.master.members.detail(variables.id),
      });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => memberService.delete(id),
    onSuccess: () => {
      invalidationMap.master.member().forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
