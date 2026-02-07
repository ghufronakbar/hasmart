import { BaseResponse } from "../common";

export interface MemberCategory {
  id: number;
  code: string;
  name: string;
  color: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateMemberCategoryDTO {
  code: string;
  name: string;
  color: string;
}

export type UpdateMemberCategoryDTO = Partial<CreateMemberCategoryDTO>;

export type MemberCategoryResponse = BaseResponse<MemberCategory>;
export type MemberCategoryListResponse = BaseResponse<MemberCategory[]>;
