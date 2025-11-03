import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET() {
  try {
    const suratList = await prisma.suratKeluar.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (suratList.length === 0) {
      return NextResponse.json({ ok: false, error: "Tidak ada data surat" }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // landscape A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const marginX = 40;
    const startY = 530;
    const rowHeight = 30;
    const colWidths = [50, 100, 140, 200, 150, 100];

    // header kolom
    const headers = [
      "NOMOR URUT",
      "TANGGAL PENGIRIMAN",
      "TANGGAL DAN NOMOR SURAT",
      "ISI SINGKAT SURAT YANG DIKIRIM",
      "DITUJUKAN KEPADA",
      "KETERANGAN",
    ];

    // gambar header
    let x = marginX;
    headers.forEach((h, i) => {
      page.drawRectangle({
        x,
        y: startY,
        width: colWidths[i],
        height: rowHeight,
        borderWidth: 1,
        color: rgb(1, 1, 1),
        borderColor: rgb(0, 0, 0),
      });
      page.drawText(h, {
        x: x + 5,
        y: startY + 10,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      x += colWidths[i];
    });

    // isi data surat
    let y = startY - rowHeight;
    suratList.forEach((surat, index) => {
      x = marginX;
      const values = [
        surat.nomorUrut?.toString() ?? "",
        surat.tanggalKirim ? surat.tanggalKirim.toISOString().split("T")[0] : "",
        `${surat.tanggalSurat?.toISOString().split("T")[0] || ""}\n${surat.nomorSurat}`,
        surat.perihal || "",
        surat.tujuan || "",
        surat.keterangan || "",
      ];

      values.forEach((val, i) => {
        page.drawRectangle({
          x,
          y,
          width: colWidths[i],
          height: rowHeight,
          borderWidth: 1,
          color: rgb(1, 1, 1),
          borderColor: rgb(0, 0, 0),
        });
        page.drawText(val, {
          x: x + 5,
          y: y + 10,
          size: 8,
          font,
          color: rgb(0, 0, 0),
        });
        x += colWidths[i];
      });

      y -= rowHeight;

      // buat halaman baru kalau kebanyakan
      if (y < 40) {
        y = startY;
        const newPage = pdfDoc.addPage([842, 595]);
        newPage.drawText(`Halaman ${pdfDoc.getPageCount()}`, {
          x: 400,
          y: 20,
          size: 8,
          font,
          color: rgb(0, 0, 0),
        });
      }
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="BukuEkspedisi.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF all download error:", error);
    return NextResponse.json({ ok: false, error: "Gagal membuat PDF" }, { status: 500 });
  }
}
