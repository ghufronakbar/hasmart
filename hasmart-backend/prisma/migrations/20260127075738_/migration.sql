/*
  Warnings:

  - You are about to drop the column `percentage_discount` on the `master_member_categories` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_discount_amount` on the `transaction_sales` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_tax_amount` on the `transaction_sales` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_discount_amount` on the `transaction_sales_items` table. All the data in the column will be lost.
  - Added the required column `recorded_amount_custom_discount` to the `transaction_sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_percentage_custom_discount` to the `transaction_sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_amount_custom_discount` to the `transaction_sales_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_percentage_custom_discount` to the `transaction_sales_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "master_member_categories" DROP COLUMN "percentage_discount";

-- AlterTable
ALTER TABLE "transaction_sales" DROP COLUMN "recorded_discount_amount",
DROP COLUMN "recorded_tax_amount",
ADD COLUMN     "recorded_amount_custom_discount" INTEGER NOT NULL,
ADD COLUMN     "recorded_percentage_custom_discount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transaction_sales_items" DROP COLUMN "recorded_discount_amount",
ADD COLUMN     "recorded_amount_custom_discount" INTEGER NOT NULL,
ADD COLUMN     "recorded_percentage_custom_discount" INTEGER NOT NULL;
