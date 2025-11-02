import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET() {
  try {
    // Ambil semua data surat keluar
    const suratList = await prisma.suratKeluar.findMany({
      orderBy: { nomorUrut: "asc" },
    });

    // Jika tidak ada data, return error yang lebih informatif
    if (!suratList || suratList.length === 0) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Tidak ada data surat keluar yang tersedia untuk diekspor" 
        }, 
        { status: 404 }
      );
    }

    // Buat PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Ukuran halaman A4 portrait
    const pageWidth = 595;  // A4 width in points
    const pageHeight = 842; // A4 height in points
    
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - 50; // Start from top

    // Judul
    page.drawText("BUKU EKSPEDISI SURAT KELUAR", {
      x: 50,
      y: currentY,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    currentY -= 30;

    page.drawText(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} - Total: ${suratList.length} data`, {
      x: 50,
      y: currentY,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    currentY -= 40;

    // Header tabel
    const headers = [
      "NO",
      "TANGGAL KIRIM",
      "TANGGAL & NOMOR SURAT", 
      "ISI SINGKAT",
      "TUJUAN",
      "KETERANGAN"
    ];

    const colWidths = [30, 70, 120, 150, 100, 80];
    const rowHeight = 20;

    // Fungsi untuk menggambar baris
    const drawTableRow = (y: number, cells: string[], isHeader: boolean = false) => {
      let x = 30;
      
      cells.forEach((text, index) => {
        // Gambar border
        page.drawRectangle({
          x,
          y: y - rowHeight,
          width: colWidths[index],
          height: rowHeight,
          borderWidth: 1,
          borderColor: rgb(0, 0, 0),
        });

        // Draw text
        page.drawText(text, {
          x: x + 2,
          y: y - rowHeight + 5,
          size: isHeader ? 9 : 8,
          font: isHeader ? fontBold : font,
          color: rgb(0, 0, 0),
          maxWidth: colWidths[index] - 4,
        });

        x += colWidths[index];
      });
    };

    // Draw header
    drawTableRow(currentY, headers, true);
    currentY -= rowHeight;

    // Draw data rows
    for (const surat of suratList) {
      // Cek jika perlu halaman baru
      if (currentY < 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - 50;
        
        // Draw header di halaman baru
        drawTableRow(currentY, headers, true);
        currentY -= rowHeight;
      }

      const rowData = [
        surat.nomorUrut?.toString() || "-",
        surat.tanggalKirim ? new Date(surat.tanggalKirim).toLocaleDateString('id-ID') : "-",
        `${surat.tanggalSurat ? new Date(surat.tanggalSurat).toLocaleDateString('id-ID') : "-"}\n${surat.nomorSurat || "-"}`,
        surat.perihal?.substring(0, 40) + (surat.perihal && surat.perihal.length > 40 ? "..." : "") || "-",
        surat.tujuan?.substring(0, 25) + (surat.tujuan && surat.tujuan.length > 25 ? "..." : "") || "-",
        surat.keterangan?.substring(0, 25) + (surat.keterangan && surat.keterangan.length > 25 ? "..." : "") || "-",
      ];

      drawTableRow(currentY, rowData, false);
      currentY -= rowHeight;
    }

    // Konversi ke buffer
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Return response PDF
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="buku-ekspedisi-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: "Gagal membuat PDF: " + (error instanceof Error ? error.message : "Unknown error") 
      },
      { status: 500 }
    );
  }
}