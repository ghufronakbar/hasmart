/*
  Warnings:

  - You are about to drop the column `recorded_profit_amount` on the `master_items` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_profit_percentage` on the `master_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "item_variants" ADD COLUMN     "recorded_profit_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recorded_profit_percentage" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "master_items" DROP COLUMN "recorded_profit_amount",
DROP COLUMN "recorded_profit_percentage";
