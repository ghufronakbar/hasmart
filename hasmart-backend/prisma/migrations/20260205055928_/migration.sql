/*
  Warnings:

  - You are about to drop the column `cash_change` on the `transaction_sells` table. All the data in the column will be lost.
  - You are about to drop the column `cash_received` on the `transaction_sells` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transaction_sales" ADD COLUMN     "cash_change" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cash_received" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "transaction_sells" DROP COLUMN "cash_change",
DROP COLUMN "cash_received";
