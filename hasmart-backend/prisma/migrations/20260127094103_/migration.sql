/*
  Warnings:

  - A unique constraint covering the columns `[master_item_id,branch_id]` on the table `item_branches` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "item_branches_master_item_id_branch_id_key" ON "item_branches"("master_item_id", "branch_id");
