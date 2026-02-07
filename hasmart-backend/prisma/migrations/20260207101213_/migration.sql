-- CreateEnum
CREATE TYPE "TransactionCashFlowType" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "transaction_cash_flows" (
    "id" SERIAL NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "amount" DECIMAL(18,2) NOT NULL,
    "type" "TransactionCashFlowType" NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_cash_flows_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transaction_cash_flows" ADD CONSTRAINT "transaction_cash_flows_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
