/*
  Warnings:

  - Added the required column `recorded_global_stock` to the `master_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "master_items" ADD COLUMN     "recorded_global_stock" INTEGER NOT NULL;
