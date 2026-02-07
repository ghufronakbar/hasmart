/*
  Warnings:

  - You are about to drop the column `due_date` on the `transaction_sales` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_percentage_custom_discount` on the `transaction_sales` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_date` on the `transaction_sales` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_amount_custom_discount` on the `transaction_sales_items` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_percentage_custom_discount` on the `transaction_sales_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoice_number]` on the table `transaction_sales` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recorded_discount_amount` to the `transaction_sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_discount_amount` to the `transaction_sales_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transaction_sales" DROP COLUMN "due_date",
DROP COLUMN "recorded_percentage_custom_discount",
DROP COLUMN "transaction_date",
ADD COLUMN     "recorded_discount_amount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transaction_sales_items" DROP COLUMN "recorded_amount_custom_discount",
DROP COLUMN "recorded_percentage_custom_discount",
ADD COLUMN     "recorded_discount_amount" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "transaction_sales_discounts" (
    "id" SERIAL NOT NULL,
    "order_index" INTEGER NOT NULL,
    "transaction_sales_item_id" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "recorded_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sales_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_sales_returns" (
    "id" SERIAL NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "transactionSalesId" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "recorded_sub_total_amount" INTEGER NOT NULL,
    "recorded_discount_amount" INTEGER NOT NULL,
    "recorded_total_amount" INTEGER NOT NULL,
    "master_member_id" INTEGER,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sales_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_sales_return_items" (
    "id" SERIAL NOT NULL,
    "transaction_sales_return_id" INTEGER NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "master_item_variant_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "recorded_conversion" INTEGER NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "recorded_sub_total_amount" INTEGER NOT NULL,
    "recorded_discount_amount" INTEGER NOT NULL,
    "recorded_total_amount" INTEGER NOT NULL,
    "sales_price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sales_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_sales_return_discounts" (
    "id" SERIAL NOT NULL,
    "order_index" INTEGER NOT NULL,
    "transaction_sales_return_item_id" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "recorded_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sales_return_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_transfers" (
    "id" SERIAL NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "master_item_variant_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "recorded_conversion" INTEGER NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "from_id" INTEGER NOT NULL,
    "to_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_adjustments" (
    "id" SERIAL NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "master_item_variant_id" INTEGER NOT NULL,
    "gap_amount" INTEGER NOT NULL,
    "recorded_gap_conversion" INTEGER NOT NULL,
    "total_gap_amount" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaction_sales_returns_returnNumber_key" ON "transaction_sales_returns"("returnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_sales_invoice_number_key" ON "transaction_sales"("invoice_number");

-- AddForeignKey
ALTER TABLE "transaction_sales_discounts" ADD CONSTRAINT "transaction_sales_discounts_transaction_sales_item_id_fkey" FOREIGN KEY ("transaction_sales_item_id") REFERENCES "transaction_sales_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_returns" ADD CONSTRAINT "transaction_sales_returns_transactionSalesId_fkey" FOREIGN KEY ("transactionSalesId") REFERENCES "transaction_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_returns" ADD CONSTRAINT "transaction_sales_returns_master_member_id_fkey" FOREIGN KEY ("master_member_id") REFERENCES "master_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_returns" ADD CONSTRAINT "transaction_sales_returns_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_return_items" ADD CONSTRAINT "transaction_sales_return_items_transaction_sales_return_id_fkey" FOREIGN KEY ("transaction_sales_return_id") REFERENCES "transaction_sales_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_return_items" ADD CONSTRAINT "transaction_sales_return_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_return_items" ADD CONSTRAINT "transaction_sales_return_items_master_item_variant_id_fkey" FOREIGN KEY ("master_item_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_return_discounts" ADD CONSTRAINT "transaction_sales_return_discounts_transaction_sales_retur_fkey" FOREIGN KEY ("transaction_sales_return_item_id") REFERENCES "transaction_sales_return_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_transfers" ADD CONSTRAINT "transaction_transfers_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_transfers" ADD CONSTRAINT "transaction_transfers_master_item_variant_id_fkey" FOREIGN KEY ("master_item_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_transfers" ADD CONSTRAINT "transaction_transfers_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_transfers" ADD CONSTRAINT "transaction_transfers_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_adjustments" ADD CONSTRAINT "transaction_adjustments_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_adjustments" ADD CONSTRAINT "transaction_adjustments_master_item_variant_id_fkey" FOREIGN KEY ("master_item_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_adjustments" ADD CONSTRAINT "transaction_adjustments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
