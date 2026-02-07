-- AlterTable
ALTER TABLE "transaction_adjustments" ADD COLUMN     "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
