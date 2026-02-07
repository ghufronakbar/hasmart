import { z } from "zod";

export const UserStatusSchema = z.object({});

export type UserStatusType = z.infer<typeof UserStatusSchema>;

export const FirstTimeSetupBodySchema = z.object({
  name: z.string().min(3),
  password: z.string().min(6),
});

export type FirstTimeSetupBodyType = z.infer<typeof FirstTimeSetupBodySchema>;

export const LoginBodySchema = z.object({
  name: z.string(),
  password: z.string(),
});

export type LoginBodyType = z.infer<typeof LoginBodySchema>;

const UserAccessSchema = z.object({
  accessOverviewRead: z.boolean().default(false),
  accessReportRead: z.boolean().default(false),
  accessPointOfSalesRead: z.boolean().default(false),
  accessPointOfSalesWrite: z.boolean().default(false),
  accessPrintLabelRead: z.boolean().default(false),
  accessFrontStockRead: z.boolean().default(false),
  accessFrontStockWrite: z.boolean().default(false),
  accessFrontStockHistoryRead: z.boolean().default(false),
  accessAppUserRead: z.boolean().default(false),
  accessAppUserWrite: z.boolean().default(false),
  accessAppBranchWrite: z.boolean().default(false),
  accessMasterItemRead: z.boolean().default(false),
  accessMasterItemWrite: z.boolean().default(false),
  accessMasterItemCategoryRead: z.boolean().default(false),
  accessMasterItemCategoryWrite: z.boolean().default(false),
  accessMasterMemberRead: z.boolean().default(false),
  accessMasterMemberWrite: z.boolean().default(false),
  accessMasterMemberCategoryRead: z.boolean().default(false),
  accessMasterMemberCategoryWrite: z.boolean().default(false),
  accessMasterSupplierRead: z.boolean().default(false),
  accessMasterSupplierWrite: z.boolean().default(false),
  accessMasterUnitRead: z.boolean().default(false),
  accessMasterUnitWrite: z.boolean().default(false),
  accessTransactionPurchaseRead: z.boolean().default(false),
  accessTransactionPurchaseWrite: z.boolean().default(false),
  accessTransactionPurchaseReturnRead: z.boolean().default(false),
  accessTransactionPurchaseReturnWrite: z.boolean().default(false),
  accessTransactionSalesRead: z.boolean().default(false),
  accessTransactionSalesWrite: z.boolean().default(false),
  accessTransactionSalesReturnRead: z.boolean().default(false),
  accessTransactionSalesReturnWrite: z.boolean().default(false),
  accessTransactionSellRead: z.boolean().default(false),
  accessTransactionSellWrite: z.boolean().default(false),
  accessTransactionSellReturnRead: z.boolean().default(false),
  accessTransactionSellReturnWrite: z.boolean().default(false),
  accessTransactionTransferRead: z.boolean().default(false),
  accessTransactionTransferWrite: z.boolean().default(false),
  accessTransactionAdjustmentRead: z.boolean().default(false),
  accessTransactionAdjustmentWrite: z.boolean().default(false),
});

export const CreateUserBodySchema = z
  .object({
    name: z.string().min(3),
    password: z.string().min(6),
    isActive: z.boolean().default(true),
  })
  .merge(UserAccessSchema);

export type CreateUserBodyType = z.infer<typeof CreateUserBodySchema>;

export const UpdateUserAccessBodySchema = UserAccessSchema;

export type UpdateUserAccessBodyType = z.infer<
  typeof UpdateUserAccessBodySchema
>;

export const EditProfileBodySchema = z.object({
  name: z.string().min(3),
});

export type EditProfileBodyType = z.infer<typeof EditProfileBodySchema>;

export const ChangePasswordBodySchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export type ChangePasswordBodyType = z.infer<typeof ChangePasswordBodySchema>;

export const ResetPasswordBodySchema = z.object({
  newPassword: z.string().min(6),
});

export type ResetPasswordBodyType = z.infer<typeof ResetPasswordBodySchema>;
