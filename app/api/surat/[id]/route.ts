import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // (1) Read optional deleter from header (e.g., set this from your auth middleware)
    const currentUserId = req.headers.get("x-user-id") ?? undefined;

    // (2) Look up the surat first so we can both verify it exists
    //     and have a safe fallback userId for the log FK.
    const surat = await prisma.suratKeluar.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        nomorSurat: true,
        tujuan: true,
        perihal: true,
        tanggalSurat: true,
        nomorUrut: true,
      },
    });

    if (!surat) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    // (3) Get the year of the surat to be deleted
    const deletedYear = new Date(surat.tanggalSurat).getFullYear();
    const deletedNomorUrut = surat.nomorUrut;

    // (4) Hard delete
    await prisma.suratKeluar.delete({ where: { id } });

    // (5) Update nomor urut for all subsequent records in the same year
    await prisma.suratKeluar.updateMany({
      where: {
        tanggalSurat: {
          gte: new Date(deletedYear, 0, 1),
          lt: new Date(deletedYear + 1, 0, 1),
        },
        nomorUrut: {
          gt: deletedNomorUrut,
        },
      },
      data: {
        nomorUrut: {
          decrement: 1,
        },
      },
    });

    // (6) Write activity log (string literals work across Prisma client versions)
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "SURAT_KELUAR",
        entityId: surat.id,
        userId: currentUserId ?? surat.userId, // fallback to original creator if no header
        metadata: {
          hardDelete: true,
          nomorSurat: surat.nomorSurat,
          tujuan: surat.tujuan,
          perihal: surat.perihal,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Delete failed" },
      { status: 400 }
    );
  }
}
