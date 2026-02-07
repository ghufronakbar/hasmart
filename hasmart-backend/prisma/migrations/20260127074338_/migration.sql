/*
  Warnings:

  - You are about to drop the column `order` on the `transaction_purchase_discounts` table. All the data in the column will be lost.
  - You are about to drop the column `reference_number` on the `transaction_purchase_returns` table. All the data in the column will be lost.
  - You are about to drop the column `return_date` on the `transaction_purchase_returns` table. All the data in the column will be lost.
  - Added the required column `order_index` to the `transaction_purchase_discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch_id` to the `transaction_purchase_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoice_number` to the `transaction_purchase_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `master_supplier_id` to the `transaction_purchase_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_discount_amount` to the `transaction_purchase_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_sub_total_amount` to the `transaction_purchase_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_tax_amount` to the `transaction_purchase_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded_total_amount` to the `transaction_purchase_returns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_date` to the `transaction_purchase_returns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transaction_purchase_discounts" DROP COLUMN "order",
ADD COLUMN     "order_index" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transaction_purchase_returns" DROP COLUMN "reference_number",
DROP COLUMN "return_date",
ADD COLUMN     "branch_id" INTEGER NOT NULL,
ADD COLUMN     "invoice_number" TEXT NOT NULL,
ADD COLUMN     "master_supplier_id" INTEGER NOT NULL,
ADD COLUMN     "recorded_discount_amount" INTEGER NOT NULL,
ADD COLUMN     "recorded_sub_total_amount" INTEGER NOT NULL,
ADD COLUMN     "recorded_tax_amount" INTEGER NOT NULL,
ADD COLUMN     "recorded_total_amount" INTEGER NOT NULL,
ADD COLUMN     "transaction_date" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "transaction_purchase_return_items" (
    "id" SERIAL NOT NULL,
    "transaction_purchase_return_id" INTEGER NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "master_item_variant_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "recorded_conversion" INTEGER NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "recorded_sub_total_amount" INTEGER NOT NULL,
    "recorded_discount_amount" INTEGER NOT NULL,
    "recorded_total_amount" INTEGER NOT NULL,
    "purchase_price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_purchase_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_purchase_return_discounts" (
    "id" SERIAL NOT NULL,
    "order_index" INTEGER NOT NULL,
    "transaction_purchase_return_item_id" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "recorded_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_purchase_return_discounts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transaction_purchase_returns" ADD CONSTRAINT "transaction_purchase_returns_master_supplier_id_fkey" FOREIGN KEY ("master_supplier_id") REFERENCES "master_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchase_returns" ADD CONSTRAINT "transaction_purchase_returns_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchase_return_items" ADD CONSTRAINT "transaction_purchase_return_items_transaction_purchase_ret_fkey" FOREIGN KEY ("transaction_purchase_return_id") REFERENCES "transaction_purchase_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchase_return_items" ADD CONSTRAINT "transaction_purchase_return_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchase_return_items" ADD CONSTRAINT "transaction_purchase_return_items_master_item_variant_id_fkey" FOREIGN KEY ("master_item_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchase_return_discounts" ADD CONSTRAINT "transaction_purchase_return_discounts_transaction_purchase_fkey" FOREIGN KEY ("transaction_purchase_return_item_id") REFERENCES "transaction_purchase_return_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
