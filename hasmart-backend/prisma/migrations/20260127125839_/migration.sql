/*
  Warnings:

  - You are about to drop the column `recorded_amount_custom_discount` on the `transaction_sales` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transaction_purchase_returns" ADD COLUMN     "recorded_tax_percentage" INTEGER NOT NULL DEFAULT 11;

-- AlterTable
ALTER TABLE "transaction_purchases" ADD COLUMN     "recorded_tax_percentage" INTEGER NOT NULL DEFAULT 11;

-- AlterTable
ALTER TABLE "transaction_sales" DROP COLUMN "recorded_amount_custom_discount";

-- AlterTable
ALTER TABLE "transaction_sell_returns" ADD COLUMN     "recorded_tax_percentage" INTEGER NOT NULL DEFAULT 11;

-- AlterTable
ALTER TABLE "transaction_sells" ADD COLUMN     "recorded_tax_percentage" INTEGER NOT NULL DEFAULT 11;
