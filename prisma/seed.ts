/* eslint-disable no-console */
import { PrismaClient, Role, Action, EntityType } from "@prisma/client";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt"; // <-- Pastikan ini ada

const prisma = new PrismaClient();

type SuratSeed = {
  nomorSurat: string;
  tanggalSurat: string; // ISO string
  tanggalKirim: string; // ISO string
  perihal: string;
  tujuan: string;
  keterangan?: string | null;
  signDirectory?: string | null; // optional per schema
};

async function upsertUsers() {
  // Hash password default
  const adminPassword = await bcrypt.hash("admin123", 10);
  const stafPassword = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: adminPassword, // Update hash jika user sudah ada
    },
    create: {
      id: randomUUID(),
      username: "admin",
      namaLengkap: "Administrator",
      role: Role.ADMIN,
      passwordHash: adminPassword, // <-- Ini yang wajib ada
    },
  });

  const staf = await prisma.user.upsert({
    where: { username: "staf1" },
    update: {
      passwordHash: stafPassword, // Update hash jika user sudah ada
    },
    create: {
      id: randomUUID(),
      username: "staf1",
      namaLengkap: "Staf Ekspedisi",
      role: Role.STAF,
      passwordHash: stafPassword, // <-- Ini yang wajib ada
    },
  });

  // Optional: synthetic login logs
  await prisma.activityLog.createMany({
    data: [
      {
        id: randomUUID(),
        userId: admin.id,
        action: Action.LOGIN,
        entityType: EntityType.USER,
        entityId: admin.id,
        metadata: { note: "Seeded admin login (synthetic)." },
      },
      {
        id: randomUUID(),
        userId: staf.id,
        action: Action.LOGIN,
        entityType: EntityType.USER,
        entityId: staf.id,
        metadata: { note: "Seeded staf login (synthetic)." },
      },
    ],
    skipDuplicates: true,
  });

  return { admin, staf };
}

async function main() {
  const { admin, staf } = await upsertUsers();
  // await upsertSuratKeluar(staf.id); // Removed per request
  // await logExportExample(admin.id); // Removed per request

  const [users, surat, logs] = await Promise.all([
    prisma.user.count(),
    prisma.suratKeluar.count(),
    prisma.activityLog.count(),
  ]);

  console.log({ users, surat, logs });
}

main()
  .then(() => console.log("✅ Seed completed."))
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
