-- AlterTable
ALTER TABLE "LedgerStock" ADD COLUMN     "from_branch_id" INTEGER;

-- AddForeignKey
ALTER TABLE "LedgerStock" ADD CONSTRAINT "LedgerStock_from_branch_id_fkey" FOREIGN KEY ("from_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
