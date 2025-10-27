import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await prisma.suratKeluar.findMany({
      where: { deletedAt: null },
      orderBy: { nomorUrut: "asc" }
    });

    const data = rows.map((r: any) => ({
      id: r.id,
      no: r.nomorUrut,
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
    return NextResponse.json({ ok: false, error: "Failed to get data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const exists = await prisma.suratKeluar.findUnique({
      where: { nomorSurat: body.nomorSurat },
    });

    if (exists) {
      return NextResponse.json(
        { ok: false, error: "Nomor surat sudah digunakan!" },
        { status: 400 }
      );
    }

    const created = await prisma.suratKeluar.create({
      data: {
        nomorUrut: body.nomorUrut,
        nomorSurat: body.nomorSurat,
        tanggalSurat: new Date(body.tanggalSurat),
        tanggalKirim: new Date(body.tanggalKirim),
        perihal: body.perihal,
        tujuan: body.tujuan,
        keterangan: body.keterangan,
        userId: body.userId,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }
}

