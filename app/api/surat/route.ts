import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob"; // <-- upload to Vercel Blob

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
      (form.get("keterangan") as string | null) && (form.get("keterangan") as string) !== ""
        ? (form.get("keterangan") as string)
        : null;
    const userId = form.get("userId") as string | null;

    // Basic validation (same spirit as before)
    if (
      !nomorSurat ||
      !tanggalSuratRaw ||
      !tanggalPengirimanRaw ||
      !tujuan ||
      !perihal
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tolong lengkapi data secara lengkap.",
        },
        { status: 400 }
      );
    }

    // Convert "YYYY-MM-DD" -> Date
    const tanggalSurat = new Date(tanggalSuratRaw);
    const tanggalKirim = new Date(tanggalPengirimanRaw);

    // Grab the file from the form
    // In Next.js route handlers, formData().get() returns a Web File object for <input type="file" />
    const berkasFile = form.get("berkas") as File | null;

    let signDirectory: string | null = null;

    if (berkasFile && berkasFile.size > 0) {
      // Upload the file to Vercel Blob.
      // This uses your BLOB_READ_WRITE_TOKEN automatically from env.
      // We mark it public so you can access it later, and addRandomSuffix
      // so filenames don't collide. :contentReference[oaicite:3]{index=3}
      const blob = await put(berkasFile.name, berkasFile, {
        access: "public",
        addRandomSuffix: true,
      });

      // We'll store the public URL in the DB
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
        userId: userId ?? "0326d571-2e5f-4d3c-87f4-781461b238e2",
        signDirectory, // <-- <- this is the Blob URL
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (error: any) {
    console.error("Error creating surat:", error);

    // Handle duplicate nomorSurat (unique constraint)
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

    return NextResponse.json(
      {
        ok: false,
        error:
          "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
