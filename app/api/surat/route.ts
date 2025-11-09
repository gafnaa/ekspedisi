import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob"; // <-- upload to Vercel Blob

// ... (Fungsi GET tetap sama) ...
export async function GET() {
  try {
    const rows = await prisma.suratKeluar.findMany({
      orderBy: { tanggalSurat: "asc" },
    });

    // map to the shape the table expects
    const data = rows.map((r: any) => ({
      id: r.id,
      tglPengiriman: r.tanggalKirim?.toISOString() ?? null,
      noSurat: r.nomorSurat,
      tglSurat: r.tanggalSurat?.toISOString() ?? null,
      isiSingkat: r.perihal,
      ditujukan: r.tujuan,
      keterangan: r.keterangan ?? "-",
      // optional: you can also expose signDirectory if you want to show/download later
      signDirectory: r.signDirectory ?? null,
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

export async function POST(req: NextRequest) {
  try {
    // Parse multipart/form-data
    const form = await req.formData();

    // Grab primitive fields
    const nomorSurat = form.get("nomorSurat") as string | null;
    const tanggalSuratRaw = form.get("tanggalSurat") as string | null; // "YYYY-MM-DD"
    const tanggalPengirimanRaw = form.get("tanggalPengiriman") as string | null; // "YYYY-MM-DD"
    const perihal = form.get("perihal") as string | null;
    const tujuan = form.get("tujuan") as string | null;
    const keterangan =
      (form.get("keterangan") as string | null) &&
      (form.get("keterangan") as string) !== ""
        ? (form.get("keterangan") as string)
        : null;

    // --- PERUBAHAN: Dapatkan userId dari form ---
    const userId = form.get("userId") as string | null;

    // Basic validation (same spirit as before)
    if (
      !nomorSurat ||
      !tanggalSuratRaw ||
      !tanggalPengirimanRaw ||
      !tujuan ||
      !perihal ||
      !userId // <-- Tambahkan validasi userId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tolong lengkapi data secara lengkap (termasuk User ID).",
        },
        { status: 400 }
      );
    }

    // Convert "YYYY-MM-DD" -> Date
    const tanggalSurat = new Date(tanggalSuratRaw);
    const tanggalKirim = new Date(tanggalPengirimanRaw);

    const berkasFile = form.get("berkas") as File | null;

    let signDirectory: string | null = null;

    if (berkasFile && berkasFile.size > 0) {
      const blob = await put(berkasFile.name, berkasFile, {
        access: "public",
        addRandomSuffix: true,
      });
      signDirectory = blob.url;
    }

    // Create the DB record, now including signDirectory
    const created = await prisma.suratKeluar.create({
      data: {
        nomorSurat,
        tanggalSurat,
        tanggalKirim,
        perihal,
        tujuan,
        keterangan,
        userId: userId, // <-- Gunakan userId dari form, hapus fallback
        signDirectory,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (error: any) {
    console.error("Error creating surat:", error);

    if (
      error?.code === "P2002" &&
      (error?.meta?.target?.includes("nomorSurat") ||
        String(error).includes("nomorSurat") ||
        String(error).includes(
          "Unique constraint failed on the fields: (`nomorSurat`)"
        ))
    ) {
      return NextResponse.json({
        ok: false,
        error: "Nomor Surat tidak boleh sama dengan data yang sudah ada",
      });
    }

    // Tangani jika userId tidak valid (Foreign Key constraint)
    if (
      error?.code === "P2003" ||
      String(error).includes("Foreign key constraint failed")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "User ID yang dikirim tidak valid atau tidak ditemukan di database.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
