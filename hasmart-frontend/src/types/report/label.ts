import { BaseResponse } from "../common";

export interface LabelData {
  itemCode: string;
  itemName: string;
  variants: LabelVariantData[];
}

export interface LabelVariantData {
  unit: string;
  sellPrice: string;
}

export type LabelResponse = BaseResponse<LabelData[]>;
