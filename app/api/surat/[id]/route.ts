import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // (1) Read optional deleter from header (e.g., set this from your auth middleware)
    const currentUserId =
      req.headers.get('x-user-id') ?? undefined;

    // (2) Look up the surat first so we can both verify it exists
    //     and have a safe fallback userId for the log FK.
    const surat = await prisma.suratKeluar.findUnique({
      where: { id },
      select: { id: true, userId: true, nomorSurat: true, tujuan: true, perihal: true },
    });

    if (!surat) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    // (3) Hard delete
    await prisma.suratKeluar.delete({ where: { id } });

    // (4) Write activity log (string literals work across Prisma client versions)
    await prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entityType: 'SURAT_KELUAR',
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
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 400 });
  }
}


export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ tambahkan await
  try {
    const surat = await prisma.suratKeluar.findUnique({
      where: { id },
    });
    if (!surat) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: surat });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const body = await req.json();
    
    // 🔧 PERBAIKAN: Fungsi toDate yang mengembalikan Date atau undefined (bukan null)
    const toDate = (val: any): Date | undefined => {
      if (!val) return undefined;
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    };

    const updated = await prisma.suratKeluar.update({
      where: { id },
      data: {
        nomorUrut: body.nomorUrut,
        nomorSurat: body.nomorSurat,
        tanggalSurat: toDate(body.tanggalSurat), // ✅ Sekarang compatible
        tanggalKirim: toDate(body.tanggalPengiriman), // ✅ Sesuaikan dengan field dari frontend
        perihal: body.perihal,
        tujuan: body.tujuan,
        keterangan: body.keterangan,
        userId: body.userId,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error: any) {
    console.error("PUT error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
}
