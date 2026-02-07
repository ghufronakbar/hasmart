-- AlterTable
ALTER TABLE "item_branches" ADD COLUMN     "recorded_front_stock" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "front_stock_transfers" (
    "id" SERIAL NOT NULL,
    "notes" TEXT NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "front_stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "front_stock_transfer_items" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "recorded_conversion" INTEGER NOT NULL,
    "front_stock_transfer_id" INTEGER NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "master_variant_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "front_stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "front_stock_transfers" ADD CONSTRAINT "front_stock_transfers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "front_stock_transfers" ADD CONSTRAINT "front_stock_transfers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "front_stock_transfer_items" ADD CONSTRAINT "front_stock_transfer_items_front_stock_transfer_id_fkey" FOREIGN KEY ("front_stock_transfer_id") REFERENCES "front_stock_transfers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "front_stock_transfer_items" ADD CONSTRAINT "front_stock_transfer_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "front_stock_transfer_items" ADD CONSTRAINT "front_stock_transfer_items_master_variant_id_fkey" FOREIGN KEY ("master_variant_id") REFERENCES "item_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
