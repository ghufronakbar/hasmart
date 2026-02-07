-- AlterTable
ALTER TABLE "master_member_categories" ADD COLUMN     "percentage_discount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "transaction_sales" (
    "id" SERIAL NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "recorded_sub_total_amount" INTEGER NOT NULL,
    "recorded_discount_amount" INTEGER NOT NULL,
    "recorded_tax_amount" INTEGER NOT NULL,
    "recorded_total_amount" INTEGER NOT NULL,
    "master_member_id" INTEGER,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_sales_items" (
    "id" SERIAL NOT NULL,
    "transaction_sales_id" INTEGER NOT NULL,
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

    CONSTRAINT "transaction_sales_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transaction_sales" ADD CONSTRAINT "transaction_sales_master_member_id_fkey" FOREIGN KEY ("master_member_id") REFERENCES "master_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales" ADD CONSTRAINT "transaction_sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_items" ADD CONSTRAINT "transaction_sales_items_transaction_sales_id_fkey" FOREIGN KEY ("transaction_sales_id") REFERENCES "transaction_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_items" ADD CONSTRAINT "transaction_sales_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sales_items" ADD CONSTRAINT "transaction_sales_items_master_item_variant_id_fkey" FOREIGN KEY ("master_item_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
