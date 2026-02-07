import { BaseResponse } from "../common";

export interface User {
  id: number;
  name: string;
  isActive: boolean;
  isSuperUser: boolean;
  createdAt: string;
  updatedAt: string;

  // access
  accessOverviewRead: boolean;
  accessReportRead: boolean;
  accessPointOfSalesRead: boolean;
  accessPointOfSalesWrite: boolean;
  accessPrintLabelRead: boolean;
  accessFrontStockRead: boolean;
  accessFrontStockWrite: boolean;
  accessFrontStockHistoryRead: boolean;
  accessAppUserRead: boolean;
  accessAppUserWrite: boolean;
  accessAppBranchWrite: boolean;
  accessMasterItemRead: boolean;
  accessMasterItemWrite: boolean;
  accessMasterItemCategoryRead: boolean;
  accessMasterItemCategoryWrite: boolean;
  accessMasterMemberRead: boolean;
  accessMasterMemberWrite: boolean;
  accessMasterMemberCategoryRead: boolean;
  accessMasterMemberCategoryWrite: boolean;
  accessMasterSupplierRead: boolean;
  accessMasterSupplierWrite: boolean;
  accessMasterUnitRead: boolean;
  accessMasterUnitWrite: boolean;
  accessTransactionPurchaseRead: boolean;
  accessTransactionPurchaseWrite: boolean;
  accessTransactionPurchaseReturnRead: boolean;
  accessTransactionPurchaseReturnWrite: boolean;
  accessTransactionSalesRead: boolean;
  accessTransactionSalesWrite: boolean;
  accessTransactionSalesReturnRead: boolean;
  accessTransactionSalesReturnWrite: boolean;
  accessTransactionSellRead: boolean;
  accessTransactionSellWrite: boolean;
  accessTransactionSellReturnRead: boolean;
  accessTransactionSellReturnWrite: boolean;
  accessTransactionTransferRead: boolean;
  accessTransactionTransferWrite: boolean;
  accessTransactionAdjustmentRead: boolean;
  accessTransactionAdjustmentWrite: boolean;
  accessTransactionCashFlowRead: boolean;
  accessTransactionCashFlowWrite: boolean;
}

export interface LoginDTO {
  name: string;
  password: string;
}

export interface CreateUserDTO {
  name: string;
  password?: string;
  isActive: boolean;

  // access
  accessOverviewRead?: boolean;
  accessReportRead?: boolean;
  accessPointOfSalesRead?: boolean;
  accessPointOfSalesWrite?: boolean;
  accessPrintLabelRead?: boolean;
  accessFrontStockRead?: boolean;
  accessFrontStockWrite?: boolean;
  accessFrontStockHistoryRead?: boolean;
  accessAppUserRead?: boolean;
  accessAppUserWrite?: boolean;
  accessAppBranchWrite?: boolean;
  accessMasterItemRead?: boolean;
  accessMasterItemWrite?: boolean;
  accessMasterItemCategoryRead?: boolean;
  accessMasterItemCategoryWrite?: boolean;
  accessMasterMemberRead?: boolean;
  accessMasterMemberWrite?: boolean;
  accessMasterMemberCategoryRead?: boolean;
  accessMasterMemberCategoryWrite?: boolean;
  accessMasterSupplierRead?: boolean;
  accessMasterSupplierWrite?: boolean;
  accessMasterUnitRead?: boolean;
  accessMasterUnitWrite?: boolean;
  accessTransactionPurchaseRead?: boolean;
  accessTransactionPurchaseWrite?: boolean;
  accessTransactionPurchaseReturnRead?: boolean;
  accessTransactionPurchaseReturnWrite?: boolean;
  accessTransactionSalesRead?: boolean;
  accessTransactionSalesWrite?: boolean;
  accessTransactionSalesReturnRead?: boolean;
  accessTransactionSalesReturnWrite?: boolean;
  accessTransactionSellRead?: boolean;
  accessTransactionSellWrite?: boolean;
  accessTransactionSellReturnRead?: boolean;
  accessTransactionSellReturnWrite?: boolean;
  accessTransactionTransferRead?: boolean;
  accessTransactionTransferWrite?: boolean;
  accessTransactionAdjustmentRead?: boolean;
  accessTransactionAdjustmentWrite?: boolean;
  accessTransactionCashFlowRead?: boolean;
  accessTransactionCashFlowWrite?: boolean;
}

export interface UpdateUserAccessDTO {
  accessOverviewRead: boolean;
  accessReportRead: boolean;
  accessPointOfSalesRead: boolean;
  accessPointOfSalesWrite: boolean;
  accessPrintLabelRead: boolean;
  accessFrontStockRead: boolean;
  accessFrontStockWrite: boolean;
  accessFrontStockHistoryRead: boolean;
  accessAppUserRead: boolean;
  accessAppUserWrite: boolean;
  accessAppBranchWrite: boolean;
  accessMasterItemRead: boolean;
  accessMasterItemWrite: boolean;
  accessMasterItemCategoryRead: boolean;
  accessMasterItemCategoryWrite: boolean;
  accessMasterMemberRead: boolean;
  accessMasterMemberWrite: boolean;
  accessMasterMemberCategoryRead: boolean;
  accessMasterMemberCategoryWrite: boolean;
  accessMasterSupplierRead: boolean;
  accessMasterSupplierWrite: boolean;
  accessMasterUnitRead: boolean;
  accessMasterUnitWrite: boolean;
  accessTransactionPurchaseRead: boolean;
  accessTransactionPurchaseWrite: boolean;
  accessTransactionPurchaseReturnRead: boolean;
  accessTransactionPurchaseReturnWrite: boolean;
  accessTransactionSalesRead: boolean;
  accessTransactionSalesWrite: boolean;
  accessTransactionSalesReturnRead: boolean;
  accessTransactionSalesReturnWrite: boolean;
  accessTransactionSellRead: boolean;
  accessTransactionSellWrite: boolean;
  accessTransactionSellReturnRead: boolean;
  accessTransactionSellReturnWrite: boolean;
  accessTransactionTransferRead: boolean;
  accessTransactionTransferWrite: boolean;
  accessTransactionAdjustmentRead: boolean;
  accessTransactionAdjustmentWrite: boolean;
  accessTransactionCashFlowRead: boolean;
  accessTransactionCashFlowWrite: boolean;
}

export interface ResetPasswordDTO {
  newPassword: string;
}

export interface EditProfileDTO {
  name: string;
}

export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

export type UserResponse = BaseResponse<User>;
export type UserListResponse = BaseResponse<User[]>;

interface LoginRes {
  accessToken: string;
  refreshToken: string;
  user: User;
}
export type LoginResponse = BaseResponse<LoginRes>;

// First Time Setup
export interface FirstTimeSetupDTO {
  name: string;
  password: string;
}

export interface UserStatus {
  hasUsers: boolean;
  userCount: number;
}

export type UserStatusResponse = BaseResponse<UserStatus>;
