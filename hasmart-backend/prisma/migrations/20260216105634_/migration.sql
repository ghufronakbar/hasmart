/*
  Warnings:

  - Added the required column `before_amount` to the `LedgerStock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LedgerStock" ADD COLUMN     "before_amount" INTEGER NOT NULL;
