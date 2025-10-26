/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

type SuratSeed = {
  nomorSurat: string;
  tanggalSurat: string; // ISO string
  tanggalKirim: string; // ISO string
  perihal: string;
  tujuan: string;
  keterangan?: string | null;
};

async function upsertUsers() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: randomUUID(),
      username: 'admin',
      namaLengkap: 'Administrator',
      role: 'ADMIN',
    },
  });

  const staf = await prisma.user.upsert({
    where: { username: 'staf1' },
    update: {},
    create: {
      id: randomUUID(),
      username: 'staf1',
      namaLengkap: 'Staf Ekspedisi',
      role: 'STAF',
    },
  });

  // Optional: synthetic login logs
  await prisma.activityLog.createMany({
    data: [
      {
        id: randomUUID(),
        userId: admin.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: admin.id,
        metadata: { note: 'Seeded admin login (synthetic).' },
      },
      {
        id: randomUUID(),
        userId: staf.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: staf.id,
        metadata: { note: 'Seeded staf login (synthetic).' },
      },
    ],
    skipDuplicates: true,
  });

  return { admin, staf };
}

function generateSuratSeeds(): SuratSeed[] {
  const base = new Date();
  const rows: SuratSeed[] = [];
  for (let i = 1; i <= 10; i++) {
    const tSurat = new Date(base);
    tSurat.setDate(base.getDate() - (15 - i));

    const tKirim = new Date(tSurat);
    tKirim.setDate(tSurat.getDate() + 1);

    rows.push({
      nomorSurat: `001/${String(i).padStart(3, '0')}/EKSP/${new Date().getFullYear()}`,
      tanggalSurat: tSurat.toISOString(),
      tanggalKirim: tKirim.toISOString(),
      perihal: `Permohonan Informasi #${i}`,
      tujuan: `Instansi Tujuan ${i}`,
      keterangan: i % 3 === 0 ? 'Dikirim via kurir.' : null,
    });
  }
  return rows;
}

async function upsertSuratKeluar(createdByUserId: string) {
  const seeds = generateSuratSeeds();
  const created = [];

  for (const s of seeds) {
    const surat = await prisma.suratKeluar.upsert({
      where: { nomorSurat: s.nomorSurat }, // unique in schema
      update: {
        perihal: s.perihal,
        tujuan: s.tujuan,
        keterangan: s.keterangan ?? undefined,
      },
      create: {
        id: randomUUID(),
        nomorSurat: s.nomorSurat,
        tanggalSurat: new Date(s.tanggalSurat),
        tanggalKirim: new Date(s.tanggalKirim),
        perihal: s.perihal,
        tujuan: s.tujuan,
        keterangan: s.keterangan,
        userId: createdByUserId, // createdBy relation
      },
    });
    created.push(surat);

    await prisma.activityLog.create({
      data: {
        id: randomUUID(),
        userId: createdByUserId,
        action: 'CREATE',
        entityType: 'SURAT_KELUAR',
        entityId: surat.id,
        metadata: {
          nomorSurat: surat.nomorSurat,
          tujuan: surat.tujuan,
          perihal: surat.perihal,
        },
      },
    });
  }

  // Example: soft delete last record to demonstrate auditability
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
        action: 'DELETE',
        entityType: 'SURAT_KELUAR',
        entityId: target.id,
        metadata: { reason: 'Soft delete demo in seed.' },
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
      action: 'EXPORT',
      entityType: 'SURAT_KELUAR',
      entityId: 'BULK', // sentinel for bulk action
      metadata: {
        filter: {
          tanggalKirim_gte: '2025-01-01',
          tujuan_contains: 'Instansi',
        },
        format: 'CSV',
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
  .then(() => console.log('✅ Seed completed.'))
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
