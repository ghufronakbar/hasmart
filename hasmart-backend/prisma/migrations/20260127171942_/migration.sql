/*
  Warnings:

  - You are about to drop the column `master_item_id` on the `transaction_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `master_item_variant_id` on the `transaction_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `transaction_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_conversion` on the `transaction_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `total_qty` on the `transaction_transfers` table. All the data in the column will be lost.
  - Added the required column `transaction_date` to the `transaction_transfers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "transaction_transfers" DROP CONSTRAINT "transaction_transfers_master_item_id_fkey";

-- DropForeignKey
ALTER TABLE "transaction_transfers" DROP CONSTRAINT "transaction_transfers_master_item_variant_id_fkey";

-- AlterTable
ALTER TABLE "transaction_transfers" DROP COLUMN "master_item_id",
DROP COLUMN "master_item_variant_id",
DROP COLUMN "qty",
DROP COLUMN "recorded_conversion",
DROP COLUMN "total_qty",
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "transaction_date" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "transaction_transfer_items" (
    "id" SERIAL NOT NULL,
    "transaction_transfer_id" INTEGER NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "master_item_variant_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "recorded_conversion" INTEGER NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_transfer_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transaction_transfer_items" ADD CONSTRAINT "transaction_transfer_items_transaction_transfer_id_fkey" FOREIGN KEY ("transaction_transfer_id") REFERENCES "transaction_transfers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_transfer_items" ADD CONSTRAINT "transaction_transfer_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_transfer_items" ADD CONSTRAINT "transaction_transfer_items_master_item_variant_id_fkey" FOREIGN KEY ("master_item_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
