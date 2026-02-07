-- AlterTable
ALTER TABLE "master_items" ADD COLUMN     "recorded_profit_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recorded_profit_percentage" INTEGER NOT NULL DEFAULT 0;
