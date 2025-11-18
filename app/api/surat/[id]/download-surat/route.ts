import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // === 1. Ambil Data Surat ===
    const surat = await prisma.suratKeluar.findUnique({
      where: { id },
    });

    if (!surat) {
      return NextResponse.json(
        { error: "Surat tidak ditemukan" },
        { status: 404 }
      );
    }

    // === 2. Inisialisasi Dokumen PDF ===
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();

    // === 3. Header (Kop Surat) ===
    const centerX = width / 2;

    // Judul utama
    page.drawText("PEMERINTAH DESA KIAWA DUA BARAT", {
      x:
        centerX -
        font.widthOfTextAtSize("PEMERINTAH DESA KIAWA DUA BARAT", 14) / 2,
      y: height - 70,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Sub judul
    page.drawText("BUKU EKSPEDISI SURAT KELUAR", {
      x:
        centerX - font.widthOfTextAtSize("BUKU EKSPEDISI SURAT KELUAR", 12) / 2,
      y: height - 90,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Garis pemisah
    page.drawLine({
      start: { x: 50, y: height - 105 },
      end: { x: width - 50, y: height - 105 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // === 4. Tabel Data ===
    let yPos = height - 130;

    // Header tabel
    const headers = [
      "NO URUT",
      "TGL PENGIRIMAN",
      "TGL & NO SURAT",
      "ISI SINGKAT SURAT",
      "DITUJUKAN KEPADA",
      "KETERANGAN",
    ];

    const columnWidths = [50, 70, 90, 120, 100, 100];
    const rowHeight = 20;
    const cellPadding = 5;

    // Gambar header tabel dengan background abu-abu
    let xPos = 30;
    headers.forEach((header, index) => {
      // Background header
      page.drawRectangle({
        x: xPos,
        y: yPos - rowHeight + 2,
        width: columnWidths[index],
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.9),
      });

      // Teks header
      page.drawText(header, {
        x: xPos + cellPadding,
        y: yPos - rowHeight + cellPadding + 5,
        size: 8,
        font,
        color: rgb(0, 0, 0),
      });

      // Border header
      page.drawRectangle({
        x: xPos,
        y: yPos - rowHeight + 2,
        width: columnWidths[index],
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      xPos += columnWidths[index];
    });

    yPos -= rowHeight + 5;

    // Data rows - untuk single surat, kita buat satu baris
    const rowData = [
      surat.nomorSurat?.toString() || "-",
      surat.tanggalKirim
        ? new Date(surat.tanggalKirim).toLocaleDateString("id-ID")
        : "-",
      `${
        surat.tanggalSurat
          ? new Date(surat.tanggalSurat).toLocaleDateString("id-ID")
          : "-"
      }\n${surat.nomorSurat || "-"}`,
      surat.perihal || "-",
      surat.tujuan || "-",
      surat.keterangan || "-",
    ];

    // Gambar baris data
    xPos = 30;
    rowData.forEach((data, index) => {
      const lines = data.toString().split("\n");

      // Border cell
      page.drawRectangle({
        x: xPos,
        y: yPos - rowHeight,
        width: columnWidths[index],
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // Teks cell (support multi-line)
      lines.forEach((line: string, lineIndex: number) => {
        page.drawText(line, {
          x: xPos + cellPadding,
          y: yPos - rowHeight + cellPadding + 8 - lineIndex * 8,
          size: 8,
          font,
          color: rgb(0, 0, 0),
        });
      });

      xPos += columnWidths[index];
    });

    // === 5. Footer (Tanda Tangan) - POSISI DIPERBAIKI ===
    const footerY = 640; // Dinaikkan dari 120 menjadi 200

    // Kiri - Mengetahui
    page.drawText("Mengetahui,", {
      x: 50,
      y: footerY,
      size: 10,
      font,
    });
    page.drawText("Kepala Desa Kiawa Dua Barat", {
      x: 50,
      y: footerY - 20,
      size: 10,
      font,
    });
    page.drawText("(_________________)", {
      x: 50,
      y: footerY - 40, // Disederhanakan jaraknya
      size: 10,
      font,
    });

    // Kanan - Sekretaris
    const currentDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    page.drawText(`Kiawa Dua Barat, ${currentDate}`, {
      x: width - 200,
      y: footerY,
      size: 10,
      font,
    });
    page.drawText("Sekretaris Desa", {
      x: width - 150,
      y: footerY - 20,
      size: 10,
      font,
    });
    page.drawText("(_________________)", {
      x: width - 170,
      y: footerY - 40, // Disederhanakan jaraknya
      size: 10,
      font,
    });

    // === 6. Simpan dan Kirim PDF ===
    const pdfBytes = await pdfDoc.save();

    // Ensure we have a standard ArrayBuffer, not a SharedArrayBuffer
    const buffer = new ArrayBuffer(pdfBytes.byteLength);
    const newUint8Array = new Uint8Array(buffer);
    newUint8Array.set(pdfBytes);
    return new Response(new Blob([buffer], { type: "application/pdf" }), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="buku-ekspedisi-${
          surat.nomorSurat || id
        }.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json({ error: "Gagal membuat PDF" }, { status: 500 });
  }
}
