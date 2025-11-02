/*
  Warnings:

  - You are about to drop the column `nomorUrut` on the `SuratKeluar` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."SuratKeluar_nomorUrut_key";

-- AlterTable
ALTER TABLE "SuratKeluar" DROP COLUMN "nomorUrut",
ADD COLUMN     "signDirectory" TEXT;
