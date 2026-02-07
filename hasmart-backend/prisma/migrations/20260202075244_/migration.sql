-- AlterTable
ALTER TABLE "transaction_adjustments" ADD COLUMN     "before_total_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "final_total_amount" INTEGER NOT NULL DEFAULT 0;
