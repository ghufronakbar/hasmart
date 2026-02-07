/*
  Warnings:

  - You are about to drop the column `gap_amount` on the `transaction_adjustments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transaction_adjustments" DROP COLUMN "gap_amount",
ADD COLUMN     "input_amount" INTEGER NOT NULL DEFAULT 0;
