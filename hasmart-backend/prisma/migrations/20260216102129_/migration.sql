-- CreateEnum
CREATE TYPE "LedgerStockModelType" AS ENUM ('TRANSACTION_PURCHASE', 'TRANSACTION_PURCHASE_RETURN', 'TRANSACTION_SALES', 'TRANSACTION_SALES_RETURN', 'TRANSACTION_SELL', 'TRANSACTION_SELL_RETURN', 'TRANSACTION_TRANSFER_IN', 'TRANSACTION_TRANSFER_OUT', 'TRANSACTION_ADJUSTMENT');

-- CreateTable
CREATE TABLE "LedgerStock" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "member_id" INTEGER,
    "to_branch_id" INTEGER NOT NULL,
    "supplier_id" INTEGER,
    "model_id" INTEGER NOT NULL,
    "gap_amount" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "model_type" "LedgerStockModelType" NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "LedgerStock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LedgerStock" ADD CONSTRAINT "LedgerStock_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerStock" ADD CONSTRAINT "LedgerStock_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerStock" ADD CONSTRAINT "LedgerStock_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "master_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerStock" ADD CONSTRAINT "LedgerStock_to_branch_id_fkey" FOREIGN KEY ("to_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerStock" ADD CONSTRAINT "LedgerStock_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "master_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
