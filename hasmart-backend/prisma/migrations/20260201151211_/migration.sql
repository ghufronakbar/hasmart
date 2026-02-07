-- AlterTable
ALTER TABLE "transaction_sell_returns" ADD COLUMN     "transactionSellId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "transaction_sell_returns" ADD CONSTRAINT "transaction_sell_returns_transactionSellId_fkey" FOREIGN KEY ("transactionSellId") REFERENCES "transaction_sells"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
