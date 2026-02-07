/*
  Warnings:

  - You are about to drop the `RawLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "RawLog";

-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "fax" TEXT,
    "npwp" TEXT,
    "owner_name" TEXT,
    "receipt_size" TEXT,
    "receipt_footer" TEXT,
    "receipt_printer" TEXT,
    "label_barcode_printer" TEXT,
    "report_printer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "is_super_user" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "master_item_category_id" INTEGER NOT NULL,
    "master_supplier_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "recorded_buy_price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "master_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_branches" (
    "id" SERIAL NOT NULL,
    "recorded_stock" INTEGER NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "item_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_variants" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "unit" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "recorded_buy_price" INTEGER NOT NULL,
    "sell_price" INTEGER NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "is_base_unit" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_suppliers" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "master_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_units" (
    "id" SERIAL NOT NULL,
    "unit" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "master_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_member_categories" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" CHAR(6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "master_member_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "master_member_category_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_purchases" (
    "id" SERIAL NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "recorded_sub_total_amount" INTEGER NOT NULL,
    "recorded_discount_amount" INTEGER NOT NULL,
    "recorded_tax_amount" INTEGER NOT NULL,
    "recorded_total_amount" INTEGER NOT NULL,
    "master_supplier_id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_purchase_items" (
    "id" SERIAL NOT NULL,
    "transaction_purchase_id" INTEGER NOT NULL,
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

    CONSTRAINT "transaction_purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_purchase_discounts" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "transaction_purchase_item_id" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "recorded_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_purchase_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_purchase_returns" (
    "id" SERIAL NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "reference_number" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_purchase_returns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- AddForeignKey
ALTER TABLE "master_items" ADD CONSTRAINT "master_items_master_item_category_id_fkey" FOREIGN KEY ("master_item_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_items" ADD CONSTRAINT "master_items_master_supplier_id_fkey" FOREIGN KEY ("master_supplier_id") REFERENCES "master_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_branches" ADD CONSTRAINT "item_branches_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_branches" ADD CONSTRAINT "item_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_variants" ADD CONSTRAINT "item_variants_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_master_member_category_id_fkey" FOREIGN KEY ("master_member_category_id") REFERENCES "master_member_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchases" ADD CONSTRAINT "transaction_purchases_master_supplier_id_fkey" FOREIGN KEY ("master_supplier_id") REFERENCES "master_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchases" ADD CONSTRAINT "transaction_purchases_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchase_items" ADD CONSTRAINT "transaction_purchase_items_transaction_purchase_id_fkey" FOREIGN KEY ("transaction_purchase_id") REFERENCES "transaction_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchase_items" ADD CONSTRAINT "transaction_purchase_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchase_items" ADD CONSTRAINT "transaction_purchase_items_master_item_variant_id_fkey" FOREIGN KEY ("master_item_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_purchase_discounts" ADD CONSTRAINT "transaction_purchase_discounts_transaction_purchase_item_i_fkey" FOREIGN KEY ("transaction_purchase_item_id") REFERENCES "transaction_purchase_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
