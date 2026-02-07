-- CreateEnum
CREATE TYPE "RecordActionModelType" AS ENUM ('TRANSACTION_PURCHASE', 'TRANSACTION_PURCHASE_RETURN', 'TRANSACTION_SALES', 'TRANSACTION_SALES_RETURN', 'TRANSACTION_SELL', 'TRANSACTION_SELL_RETURN', 'TRANSACTION_TRANSFER', 'TRANSACTION_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RecordActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "transaction_sells" (
    "id" SERIAL NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "recorded_sub_total_amount" INTEGER NOT NULL,
    "recorded_discount_amount" INTEGER NOT NULL,
    "recorded_tax_amount" INTEGER NOT NULL,
    "recorded_total_amount" INTEGER NOT NULL,
    "master_member_id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_sell_items" (
    "id" SERIAL NOT NULL,
    "transaction_sell_id" INTEGER NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "master_item_variant_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "recorded_conversion" INTEGER NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "recorded_sub_total_amount" INTEGER NOT NULL,
    "recorded_discount_amount" INTEGER NOT NULL,
    "recorded_total_amount" INTEGER NOT NULL,
    "sell_price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sell_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_sell_discounts" (
    "id" SERIAL NOT NULL,
    "order_index" INTEGER NOT NULL,
    "transaction_sell_item_id" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "recorded_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sell_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_sell_returns" (
    "id" SERIAL NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "recorded_sub_total_amount" INTEGER NOT NULL,
    "recorded_discount_amount" INTEGER NOT NULL,
    "recorded_tax_amount" INTEGER NOT NULL,
    "recorded_total_amount" INTEGER NOT NULL,
    "master_member_id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sell_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_sell_return_items" (
    "id" SERIAL NOT NULL,
    "transaction_sell_return_id" INTEGER NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "master_item_variant_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "recorded_conversion" INTEGER NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "recorded_sub_total_amount" INTEGER NOT NULL,
    "recorded_discount_amount" INTEGER NOT NULL,
    "recorded_total_amount" INTEGER NOT NULL,
    "sell_price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sell_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_sell_return_discounts" (
    "id" SERIAL NOT NULL,
    "order_index" INTEGER NOT NULL,
    "transaction_sell_return_item_id" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "recorded_amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_sell_return_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_actions" (
    "id" SERIAL NOT NULL,
    "model_type" "RecordActionModelType" NOT NULL,
    "model_id" INTEGER NOT NULL,
    "action_type" "RecordActionType" NOT NULL,
    "payload_before" JSONB,
    "payload_after" JSONB,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "record_actions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transaction_sells" ADD CONSTRAINT "transaction_sells_master_member_id_fkey" FOREIGN KEY ("master_member_id") REFERENCES "master_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sells" ADD CONSTRAINT "transaction_sells_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_items" ADD CONSTRAINT "transaction_sell_items_transaction_sell_id_fkey" FOREIGN KEY ("transaction_sell_id") REFERENCES "transaction_sells"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_items" ADD CONSTRAINT "transaction_sell_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_items" ADD CONSTRAINT "transaction_sell_items_master_item_variant_id_fkey" FOREIGN KEY ("master_item_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_discounts" ADD CONSTRAINT "transaction_sell_discounts_transaction_sell_item_id_fkey" FOREIGN KEY ("transaction_sell_item_id") REFERENCES "transaction_sell_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_returns" ADD CONSTRAINT "transaction_sell_returns_master_member_id_fkey" FOREIGN KEY ("master_member_id") REFERENCES "master_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_returns" ADD CONSTRAINT "transaction_sell_returns_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_return_items" ADD CONSTRAINT "transaction_sell_return_items_transaction_sell_return_id_fkey" FOREIGN KEY ("transaction_sell_return_id") REFERENCES "transaction_sell_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_return_items" ADD CONSTRAINT "transaction_sell_return_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_return_items" ADD CONSTRAINT "transaction_sell_return_items_master_item_variant_id_fkey" FOREIGN KEY ("master_item_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_sell_return_discounts" ADD CONSTRAINT "transaction_sell_return_discounts_transaction_sell_return__fkey" FOREIGN KEY ("transaction_sell_return_item_id") REFERENCES "transaction_sell_return_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_actions" ADD CONSTRAINT "record_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
