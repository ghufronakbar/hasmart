/*
  Warnings:

  - Added the required column `action_type` to the `LedgerStock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `master_item_id` to the `LedgerStock` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LedgerStockActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- DropForeignKey
ALTER TABLE "LedgerStock" DROP CONSTRAINT "LedgerStock_to_branch_id_fkey";

-- AlterTable
ALTER TABLE "LedgerStock" ADD COLUMN     "action_type" "LedgerStockActionType" NOT NULL,
ADD COLUMN     "master_item_id" INTEGER NOT NULL,
ALTER COLUMN "to_branch_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LedgerStock" ADD CONSTRAINT "LedgerStock_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerStock" ADD CONSTRAINT "LedgerStock_to_branch_id_fkey" FOREIGN KEY ("to_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
