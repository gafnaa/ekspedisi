import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await prisma.suratKeluar.findMany({
      where: { deletedAt: null },
      orderBy: { tanggalSurat: "asc" }, // was nomorUrut, which no longer exists
    });

    // NOTE: we no longer send `no`, because nomorUrut is gone.
    const data = rows.map((r: any) => ({
      id: r.id,
      tglPengiriman: r.tanggalKirim?.toISOString() ?? null,
      noSurat: r.nomorSurat,
      tglSurat: r.tanggalSurat?.toISOString() ?? null,
      isiSingkat: r.perihal,
      ditujukan: r.tujuan,
      keterangan: r.keterangan ?? "-",
    }));

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to get data" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // We DELETE all nomorUrut logic. We just insert.
    const result = await prisma.suratKeluar.create({
      data: {
        nomorSurat: body.nomorSurat,
        tanggalSurat: new Date(body.tanggalSurat),
        tanggalKirim: new Date(body.tanggalKirim),
        perihal: body.perihal,
        tujuan: body.tujuan,
        keterangan: body.keterangan ?? null,
        userId: body.userId,
      },
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    console.error("Error creating surat:", error);

    // keep your P2002 (unique nomorSurat) handling
    if (
      error?.code === "P2002" &&
      (error?.meta?.target?.includes("nomorSurat") ||
        String(error).includes("nomorSurat") ||
        String(error).includes(
          "Unique constraint failed on the fields: (`nomorSurat`)",
        ))
    ) {
      return NextResponse.json({
        ok: false,
        error: "Nomor Surat tidak boleh sama dengan data yang sudah ada",
      });
    }

    return NextResponse.json({
      ok: false,
      error: "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.",
    });
  }
}
