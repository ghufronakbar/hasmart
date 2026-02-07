-- CreateEnum
CREATE TYPE "SalesPaymentType" AS ENUM ('CASH', 'DEBIT', 'QRIS');

-- AlterTable
ALTER TABLE "transaction_sales" ADD COLUMN     "payment_type" "SalesPaymentType" NOT NULL DEFAULT 'CASH';
