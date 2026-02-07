/*
  Warnings:

  - You are about to alter the column `recorded_profit_percentage` on the `item_variants` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `percentage` on the `transaction_purchase_discounts` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `percentage` on the `transaction_purchase_return_discounts` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `recorded_tax_percentage` on the `transaction_purchase_returns` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `recorded_tax_percentage` on the `transaction_purchases` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `percentage` on the `transaction_sales_discounts` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `percentage` on the `transaction_sales_return_discounts` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `percentage` on the `transaction_sell_discounts` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `percentage` on the `transaction_sell_return_discounts` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `recorded_tax_percentage` on the `transaction_sell_returns` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `recorded_tax_percentage` on the `transaction_sells` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE "item_variants" ALTER COLUMN "recorded_buy_price" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "sell_price" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_profit_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_profit_percentage" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "master_items" ALTER COLUMN "recorded_buy_price" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_purchase_discounts" ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "recorded_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_purchase_items" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "purchase_price" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_after_tax_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_purchase_return_discounts" ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "recorded_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_purchase_return_items" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "purchase_price" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_purchase_returns" ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_tax_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_tax_percentage" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "transaction_purchases" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_tax_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_tax_percentage" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "transaction_sales" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sales_discounts" ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "recorded_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sales_items" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "sales_price" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sales_return_discounts" ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "recorded_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sales_return_items" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "sales_price" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sales_returns" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sell_discounts" ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "recorded_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sell_items" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "sell_price" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sell_return_discounts" ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "recorded_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sell_return_items" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "sell_price" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transaction_sell_returns" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_tax_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_tax_percentage" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "transaction_sells" ALTER COLUMN "recorded_sub_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_discount_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_tax_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_total_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "recorded_tax_percentage" SET DATA TYPE DECIMAL(5,2);
