/* eslint-disable no-console */
import { PrismaClient, Role, Action, EntityType } from '@prisma/client';
import { randomUUID } from 'crypto';

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
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: randomUUID(),
      username: 'admin',
      namaLengkap: 'Administrator',
      role: Role.ADMIN,
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

  // Optional: synthetic login logs (duplicated runs will just add more logs, which is fine for an audit trail)
  await prisma.activityLog.createMany({
    data: [
      {
        id: randomUUID(),
        userId: admin.id,
        action: Action.LOGIN,
        entityType: EntityType.USER,
        entityId: admin.id,
        metadata: { note: 'Seeded admin login (synthetic).' },
      },
      {
        id: randomUUID(),
        userId: staf.id,
        action: Action.LOGIN,
        entityType: EntityType.USER,
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
  const year = base.getFullYear();
  const rows: SuratSeed[] = [];

  for (let i = 1; i <= 10; i++) {
    const tSurat = new Date(base);
    tSurat.setDate(base.getDate() - (15 - i));

    const tKirim = new Date(tSurat);
    tKirim.setDate(tSurat.getDate() + 1);

    // Provide some optional signDirectory samples (every 4th item)
    const withSign = i % 4 === 0;

    rows.push({
      nomorSurat: `001/${String(i).padStart(3, '0')}/EKSP/${year}`,
      tanggalSurat: tSurat.toISOString(),
      tanggalKirim: tKirim.toISOString(),
      perihal: `Permohonan Informasi #${i}`,
      tujuan: `Instansi Tujuan ${i}`,
      keterangan: i % 3 === 0 ? 'Dikirim via kurir.' : null,
      signDirectory: withSign ? `signatures/${year}/${String(base.getMonth() + 1).padStart(2, '0')}/${randomUUID()}/` : null,
    });
  }

  return rows;
}

async function upsertSuratKeluar(createdByUserId: string) {
  const seeds = generateSuratSeeds();
  const created: { id: string; nomorSurat: string; tujuan: string; perihal: string }[] = [];

  for (const s of seeds) {
    const surat = await prisma.suratKeluar.upsert({
      where: { nomorSurat: s.nomorSurat }, // unique in schema
      update: {
        perihal: s.perihal,
        tujuan: s.tujuan,
        keterangan: s.keterangan ?? undefined,
        signDirectory: s.signDirectory ?? undefined, // keep optional
      },
      create: {
        id: randomUUID(),
        nomorSurat: s.nomorSurat,
        tanggalSurat: new Date(s.tanggalSurat),
        tanggalKirim: new Date(s.tanggalKirim),
        perihal: s.perihal,
        tujuan: s.tujuan,
        keterangan: s.keterangan ?? undefined,
        signDirectory: s.signDirectory ?? undefined, // optional
        userId: createdByUserId, // createdBy relation
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

  // Example: soft delete last record to demonstrate auditability (idempotent with upsert above)
  if (created.length > 0) {
    const target = created[created.length - 1];
    const now = new Date();

    await prisma.suratKeluar.update({
      where: { id: target.id },
      data: {
        deletedAt: now,
        // Relation connect to the deleting user (fills deletedById)
        deletedBy: { connect: { id: createdByUserId } },
      },
    });

    await prisma.activityLog.create({
      data: {
        id: randomUUID(),
        userId: createdByUserId,
        action: Action.DELETE, // soft delete action
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
