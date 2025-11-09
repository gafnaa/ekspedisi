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

function generateSuratSeeds(): SuratSeed[] {
  const base = new Date();
  const year = base.getFullYear();
  const rows: SuratSeed[] = [];

  for (let i = 1; i <= 10; i++) {
    const tSurat = new Date(base);
    tSurat.setDate(base.getDate() - (15 - i));

    const tKirim = new Date(tSurat);
    tKirim.setDate(tSurat.getDate() + 1);

    const withSign = i % 4 === 0;

    rows.push({
      nomorSurat: `001/${String(i).padStart(3, "0")}/EKSP/${year}`,
      tanggalSurat: tSurat.toISOString(),
      tanggalKirim: tKirim.toISOString(),
      perihal: `Permohonan Informasi #${i}`,
      tujuan: `Instansi Tujuan ${i}`,
      keterangan: i % 3 === 0 ? "Dikirim via kurir." : null,
      signDirectory: withSign
        ? `signatures/${year}/${String(base.getMonth() + 1).padStart(
            2,
            "0"
          )}/${randomUUID()}/`
        : null,
    });
  }

  return rows;
}

async function upsertSuratKeluar(createdByUserId: string) {
  const seeds = generateSuratSeeds();
  const created: {
    id: string;
    nomorSurat: string;
    tujuan: string;
    perihal: string;
  }[] = [];

  for (const s of seeds) {
    const surat = await prisma.suratKeluar.upsert({
      where: { nomorSurat: s.nomorSurat }, // unique in schema
      update: {
        perihal: s.perihal,
        tujuan: s.tujuan,
        keterangan: s.keterangan ?? undefined,
        signDirectory: s.signDirectory ?? undefined,
      },
      create: {
        id: randomUUID(),
        nomorSurat: s.nomorSurat,
        tanggalSurat: new Date(s.tanggalSurat),
        tanggalKirim: new Date(s.tanggalKirim),
        perihal: s.perihal,
        tujuan: s.tujuan,
        keterangan: s.keterangan ?? undefined,
        signDirectory: s.signDirectory ?? undefined,
        userId: createdByUserId,
      },
      select: { id: true, nomorSurat: true, tujuan: true, perihal: true },
    });

    created.push(surat);

    await prisma.activityLog.create({
      data: {
        id: randomUUID(),
        userId: createdByUserId,
        action: Action.CREATE,
        entityType: EntityType.SURAT_KELUAR,
        entityId: surat.id,
        metadata: {
          nomorSurat: surat.nomorSurat,
          tujuan: surat.tujuan,
          perihal: surat.perihal,
        },
      },
    });
  }

  if (created.length > 0) {
    const target = created[created.length - 1];
    const now = new Date();

    await prisma.suratKeluar.update({
      where: { id: target.id },
      data: {
        deletedAt: now,
        deletedBy: { connect: { id: createdByUserId } },
      },
    });

    await prisma.activityLog.create({
      data: {
        id: randomUUID(),
        userId: createdByUserId,
        action: Action.DELETE,
        entityType: EntityType.SURAT_KELUAR,
        entityId: target.id,
        metadata: { reason: "Soft delete demo in seed." },
      },
    });
  }

  return created;
}

async function logExportExample(userId: string) {
  await prisma.activityLog.create({
    data: {
      id: randomUUID(),
      userId,
      action: Action.EXPORT,
      entityType: EntityType.SURAT_KELUAR,
      entityId: "BULK",
      metadata: {
        filter: {
          tanggalKirim_gte: "2025-01-01",
          tujuan_contains: "Instansi",
        },
        format: "CSV",
      },
    },
  });
}

async function main() {
  const { admin, staf } = await upsertUsers();
  await upsertSuratKeluar(staf.id);
  await logExportExample(admin.id);

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
