import { BaseResponse } from "../common";
import { MemberCategory } from "./member-category";

export interface Member {
  id: number;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  masterMemberCategoryId: number;
  masterMemberCategory?: MemberCategory;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateMemberDTO {
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  masterMemberCategoryId: number;
}

export type UpdateMemberDTO = Partial<CreateMemberDTO>;

export type MemberResponse = BaseResponse<Member>;
export type MemberListResponse = BaseResponse<Member[]>;
