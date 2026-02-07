/*
  Warnings:

  - You are about to drop the column `code` on the `item_variants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `master_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `master_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "item_variants_code_key";

-- AlterTable
ALTER TABLE "item_variants" DROP COLUMN "code";

-- AlterTable
ALTER TABLE "master_items" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "master_items_code_key" ON "master_items"("code");
