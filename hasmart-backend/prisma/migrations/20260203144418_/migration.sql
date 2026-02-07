-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refresh_token" TEXT;

-- AddForeignKey
ALTER TABLE "item_buy_price_overrides" ADD CONSTRAINT "item_buy_price_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
