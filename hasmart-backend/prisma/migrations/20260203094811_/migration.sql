-- CreateTable
CREATE TABLE "item_buy_price_overrides" (
    "id" SERIAL NOT NULL,
    "master_item_id" INTEGER NOT NULL,
    "new_buy_price" DECIMAL(18,2) NOT NULL,
    "snapshot_stock" INTEGER NOT NULL,
    "notes" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_buy_price_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_buy_price_overrides_master_item_id_created_at_idx" ON "item_buy_price_overrides"("master_item_id", "created_at");

-- AddForeignKey
ALTER TABLE "item_buy_price_overrides" ADD CONSTRAINT "item_buy_price_overrides_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
