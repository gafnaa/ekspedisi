import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ekspedisiList = await prisma.suratKeluar.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (ekspedisiList.length === 0) {
      return NextResponse.json({ ok: false, error: "Tidak ada data ekspedisi" }, { status: 404 });
    }

    return NextResponse.json(ekspedisiList);
  } catch (error) {
    console.error("API ekspedisi error:", error);
    return NextResponse.json({ ok: false, error: "Gagal mengambil data ekspedisi" }, { status: 500 });
  }
}
