import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function GET() {
  try {
    const rows = await prisma.suratKeluar.findMany({
      where: {
        deletedAt: null, // Exclude soft-deleted records
      },
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
    const userId = form.get("userId") as string | null;

    // Basic validation
    if (
      !nomorSurat ||
      !tanggalSuratRaw ||
      !tanggalPengirimanRaw ||
      !tujuan ||
      !perihal ||
      !userId
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
      let uploadSuccess = false;

      // 1. Try Vercel Blob if token exists
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        console.log("Using Vercel Blob for upload...");
        try {
          const blob = await put(berkasFile.name, berkasFile, {
            access: "public",
            addRandomSuffix: true,
          });
          signDirectory = blob.url;
          uploadSuccess = true;
          console.log("Vercel Blob upload success:", blob.url);
        } catch (blobError) {
          console.error("Vercel Blob upload failed (will try local fallback):", blobError);
          // Do not throw, let it fall through to local storage
        }
      }

      // 2. Fallback to Local Storage if Vercel Blob failed or token missing
      if (!uploadSuccess) {
        console.log("Using local storage fallback...");

        const bytes = await berkasFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const safeName = berkasFile.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const filename = `${timestamp}-${safeName}`;

        const uploadDir = path.join(process.cwd(), "public", "signatures");
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch (e) {
          // Ignore if exists
        }

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        signDirectory = `/signatures/${filename}`;
        console.log("Local storage upload success:", signDirectory);
      }
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
        userId: userId,
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
        error: `Terjadi kesalahan: ${error.message || String(error)}`,
      },
      { status: 500 }
    );
  }
}
