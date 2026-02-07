-- AlterTable
ALTER TABLE "users" ADD COLUMN     "access_transaction_cash_flow_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "access_transaction_cash_flow_write" BOOLEAN NOT NULL DEFAULT false;
