export interface LabelData {
  itemCode: string;
  itemName: string;
  variants: LabelVariantData[];
}

export interface LabelVariantData {
  unit: string;
  sellPrice: string;
}
