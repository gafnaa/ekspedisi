/* eslint-disable no-console */
import { PrismaClient, Role, Action, EntityType } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function upsertUsers() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: randomUUID(),
      username: 'admin',
      namaLengkap: 'Administrator',
      role: Role.ADMIN,
      // tandaTangan: Buffer.from(''), // optional
    },
  });

  const staf = await prisma.user.upsert({
    where: { username: 'staf1' },
    update: {},
    create: {
      id: randomUUID(),
      username: 'staf1',
      namaLengkap: 'Staf Ekspedisi',
      role: Role.STAF,
    },
  });

  // Log user creation/login
  await prisma.activityLog.createMany({
    data: [
      {
        id: randomUUID(),
        userId: admin.id,
        action: Action.LOGIN,
        entityType: EntityType.USER,
        entityId: admin.id,
        metadata: { note: 'Seeded admin login event (synthetic).' },
      },
      {
        id: randomUUID(),
        userId: staf.id,
        action: Action.LOGIN,
        entityType: EntityType.USER,
        entityId: staf.id,
        metadata: { note: 'Seeded staf login event (synthetic).' },
      },
    ],
    skipDuplicates: true,
  });

  return { admin, staf };
}

type SuratSeed = {
  nomorSurat: string;
  tanggalSurat: string; // ISO
  tanggalKirim: string; // ISO
  perihal: string;
  tujuan: string;
  keterangan?: string | null;
};

function generateSuratSeeds(): SuratSeed[] {
  const base = new Date();
  const rows: SuratSeed[] = [];
  for (let i = 1; i <= 10; i++) {
    const tSurat = new Date(base);
    tSurat.setDate(base.getDate() - (15 - i)); // spread dates

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
    // nomorSurat is unique in schema; use it as the upsert key
    const surat = await prisma.suratKeluar.upsert({
      where: { nomorSurat: s.nomorSurat },
      update: {
        // update a couple fields in case you re-run seed and want to tweak text
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

  // Example of a soft delete on one record to demonstrate audit
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
      action: Action.EXPORT,
      entityType: EntityType.SURAT_KELUAR,
      entityId: 'BULK', // no single entity; use a sentinel value
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

  // Helpful counts
  const [users, surat, logs] = await Promise.all([
    prisma.user.count(),
    prisma.suratKeluar.count(),
    prisma.activityLog.count(),
  ]);

  console.log({ users, surat, logs });
}

main()
  .then(async () => {
    console.log('✅ Seed completed.');
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
