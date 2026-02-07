/*
  Warnings:

  - You are about to drop the `members` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_master_member_category_id_fkey";

-- DropTable
DROP TABLE "members";

-- CreateTable
CREATE TABLE "master_members" (
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

    CONSTRAINT "master_members_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "master_members" ADD CONSTRAINT "master_members_master_member_category_id_fkey" FOREIGN KEY ("master_member_category_id") REFERENCES "master_member_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
