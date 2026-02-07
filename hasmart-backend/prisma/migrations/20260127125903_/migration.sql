-- AlterTable
ALTER TABLE "transaction_purchase_returns" ALTER COLUMN "recorded_tax_percentage" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transaction_purchases" ALTER COLUMN "recorded_tax_percentage" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transaction_sell_returns" ALTER COLUMN "recorded_tax_percentage" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transaction_sells" ALTER COLUMN "recorded_tax_percentage" DROP DEFAULT;
