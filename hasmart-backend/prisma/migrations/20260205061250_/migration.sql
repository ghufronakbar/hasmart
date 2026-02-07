-- AlterTable
ALTER TABLE "users" ADD COLUMN     "access_front_stock_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "access_front_stock_write" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "access_print_label_read" BOOLEAN NOT NULL DEFAULT false;
