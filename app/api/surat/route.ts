import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await prisma.suratKeluar.findMany({
      where: { deletedAt: null },
      orderBy: { nomorUrut: "asc" },
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
    return NextResponse.json(
      { ok: false, error: "Failed to get data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Get the current year
    const currentYear = new Date(body.tanggalSurat).getFullYear();

    // Count total records for current year instead of getting max
    const recordCount = await prisma.suratKeluar.count({
      where: {
        tanggalSurat: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
    });

    // Next number is simply count + 1
    const nextNomorUrut = recordCount + 1;

    // Create new record
    const result = await prisma.suratKeluar.create({
      data: {
        ...body,
        nomorUrut: nextNomorUrut,
        tanggalSurat: new Date(body.tanggalSurat),
        tanggalKirim: new Date(body.tanggalKirim),
      },
    });

    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error("Error creating surat:", error);
    return Response.json({
      ok: false,
      error: String(error),
    });
  }
}
