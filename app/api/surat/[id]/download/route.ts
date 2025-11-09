import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // <-- params is a Promise here
) {
  try {
    const { id } = await ctx.params;       // <-- unwrap it

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );
    }

    // 1) Find the record and get the blob URL
    const surat = await prisma.suratKeluar.findUnique({
      where: { id },
      select: { id: true, nomorSurat: true, signDirectory: true },
    });

    if (!surat || !surat.signDirectory) {
      return NextResponse.json(
        { ok: false, error: "File tidak ditemukan" },
        { status: 404 }
      );
    }

    // 2) Fetch from Vercel Blob
    const blobRes = await fetch(surat.signDirectory);
    if (!blobRes.ok || !blobRes.body) {
      return NextResponse.json(
        { ok: false, error: "Gagal mengambil file dari storage" },
        { status: 502 }
      );
    }

    // 3) Build a nice filename (fallback to extension from URL)
    const url = new URL(surat.signDirectory);
    const extMatch = url.pathname.match(/\.(png|jpg|jpeg|webp|gif|pdf|bmp|tif|tiff|svg)$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : ".bin";
    const safeNoSurat = (surat.nomorSurat || "tanda-tangan").replace(/[^\w.-]+/g, "_");
    const filename = `${safeNoSurat}${ext}`;

    const contentType = blobRes.headers.get("content-type") || "application/octet-stream";
    const headers = new Headers();
    headers.set("content-type", contentType);
    headers.set("content-disposition", `attachment; filename="${filename}"`);
    const size = blobRes.headers.get("content-length");
    if (size) headers.set("content-length", size);

    // 4) Stream it back
    return new Response(blobRes.body, { headers, status: 200 });
  } catch (err) {
    console.error("GET /api/surat/[id]/download error:", err);
    return NextResponse.json(
      { ok: false, error: "Download failed" },
      { status: 500 }
    );
  }
}
