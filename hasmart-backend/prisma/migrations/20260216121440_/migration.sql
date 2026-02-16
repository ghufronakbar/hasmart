/*
  Warnings:

  - You are about to drop the column `before_amount` on the `LedgerStock` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `LedgerStock` table. All the data in the column will be lost.
  - Added the required column `before_data_amount` to the `LedgerStock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_stock_after_amount` to the `LedgerStock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_stock_before_amount` to the `LedgerStock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LedgerStock" DROP COLUMN "before_amount",
DROP COLUMN "total_amount",
ADD COLUMN     "before_data_amount" INTEGER NOT NULL,
ADD COLUMN     "recorded_stock_after_amount" INTEGER NOT NULL,
ADD COLUMN     "recorded_stock_before_amount" INTEGER NOT NULL;
