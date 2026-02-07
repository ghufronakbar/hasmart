-- AlterTable
ALTER TABLE "transaction_purchase_returns" ADD COLUMN     "transaction_purchase_id" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "transaction_purchase_returns" ADD CONSTRAINT "transaction_purchase_returns_transaction_purchase_id_fkey" FOREIGN KEY ("transaction_purchase_id") REFERENCES "transaction_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
