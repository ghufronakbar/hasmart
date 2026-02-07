import { BaseResponse } from "../common";

export interface Unit {
  id: number;
  unit: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateUnitDTO {
  unit: string;
  name: string;
}

export type UpdateUnitDTO = Partial<CreateUnitDTO>;

export type UnitResponse = BaseResponse<Unit>;
export type UnitListResponse = BaseResponse<Unit[]>;
