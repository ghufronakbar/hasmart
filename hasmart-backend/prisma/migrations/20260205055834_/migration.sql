-- AlterTable
ALTER TABLE "transaction_sells" ADD COLUMN     "cash_change" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cash_received" DECIMAL(18,2) NOT NULL DEFAULT 0;
