import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from "next/headers";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const headerUserId = req.headers.get("x-user-id") ?? undefined;

    const cookieStore = await cookies();
    const cookieUserId =
      cookieStore.get("userId")?.value ||
      cookieStore.get("uid")?.value ||
      undefined;

    const currentUserId = headerUserId ?? cookieUserId;
    console.log("Current User ID for deletion:", currentUserId);


    const surat = await prisma.suratKeluar.findUnique({
      where: { id },
      select: { id: true, userId: true, nomorSurat: true, tujuan: true, perihal: true, deletedAt: true},
    });

    if (!surat) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    if (surat.deletedAt) {
      return NextResponse.json({ ok: true });
    }

    // ✅ Soft delete
    await prisma.suratKeluar.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: currentUserId     
      }
    });
    await prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entityType: 'SURAT_KELUAR',
        entityId: surat.id,
        userId: currentUserId ?? surat.userId, 
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
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 400 });
  }
}