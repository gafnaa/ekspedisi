import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from 'xlsx';

// Fungsi helper untuk format tanggal
function formatTanggal(date:any) {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  return `${day} ${monthNames[month - 1]} ${year}`;
}

function formatTanggalSekarang() {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  return `${day} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
}

export async function GET() {
  try {
    const suratList = await prisma.suratKeluar.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      
    });

    if (suratList.length === 0) {
      return NextResponse.json({ ok: false, error: "Tidak ada data surat" }, { status: 404 });
    }

    // Membuat workbook baru
    const workbook = XLSX.utils.book_new();
    
    // Data untuk Excel - format seperti screenshot
    const allRows = [
      // Header Instansi (baris 1-3)
      ["PEMERINTAH GARUT MINAHASA", "", "", "", "", ""],
      ["BAYONGBONG KAWANGKOAN UTARA", "", "", "", "", ""],
      ["DESA CINISITI KIAWA DUA BARAT", "", "", "", "", ""],
      [""], // baris kosong (baris 4)
      ["BUKU EKSPEDISI", "", "", "", "", ""], // baris 5
      [""], // baris kosong (baris 6)
      
      // Header tabel (baris 7)
      ["NOMOR URUT", "TANGGAL PENGIRIMAN", "TANGGAL DAN NOMOR SURAT", "ISI SINGKAT SURAT YANG DIKIRIM", "DITUJUKAN KEPADA", "KETERANGAN"]
    ];

    // Data surat
    suratList.forEach((surat, index) => {
      allRows.push([
        (index + 1).toString(),
        surat.tanggalKirim ? formatTanggal(surat.tanggalKirim) : "",
        `${surat.tanggalSurat ? formatTanggal(surat.tanggalSurat) : ""}${surat.nomorSurat ? " / " + surat.nomorSurat : ""}`,
        surat.perihal || "",
        surat.tujuan || "",
        surat.keterangan || ""
      ]);
    });
    
    // Dapatkan baris awal data tabel
    const dataStartRowIndex = allRows.length;

    // Tambahkan baris kosong setelah data tabel (5 baris)
    for (let i = 0; i < 5; i++) {
      allRows.push(["", "", "", "", "", ""]);
    }
    
    // BAGIAN PENANDATANGAN YANG DIPERBARUI

    // Baris Tanggal dan Jabatan
    allRows.push([
      "MENGETAHUI", "LURAH KIAWA DUA BARAT", "", 
      "", 
      `KIAWA DUA BARAT, ${formatTanggalSekarang()}`, "SEKRETARIS KIAWA DUA BARAT"
    ]);
    
    // Baris kosong untuk tanda tangan (8 baris)
    for (let i = 0; i < 8; i++) {
      allRows.push(["", "", "", "", "", ""]);
    }
    
    // Baris Nama dan NIP
    allRows.push([
      "H YULANDI ABD. ROCHIM, SE", "NIPD/NIP : 67676767", "", 
      "", 
      "HARIS DHARMA PUTRA", "NIPD/NIP :"
    ]);
    
    // Dapatkan baris awal penandatanganan
    const signStartRowIndex = allRows.length - 1 - 8 - 1; // 1 (Nama & NIP) + 8 (spasi TTd) + 1 (Tanggal & Jabatan) = 10 baris ke atas dari akhir.
    

    // Buat worksheet dari data
    const worksheet = XLSX.utils.aoa_to_sheet(allRows);

    // Atur lebar kolom lebih optimal
    const colWidths = [
      { wch: 12 },  // A: NOMOR URUT
      { wch: 18 },  // B: TANGGAL PENGIRIMAN
      { wch: 25 },  // C: TANGGAL DAN NOMOR SURAT
      { wch: 35 },  // D: ISI SINGKAT
      { wch: 25 },  // E: DITUJUKAN KEPADA
      { wch: 20 }   // F: KETERANGAN
    ];
    worksheet['!cols'] = colWidths;

    // Inisialisasi merges
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    
    // Merge cell untuk header instansi (baris 1-3)
    for (let row = 0; row < 3; row++) {
      worksheet['!merges'].push({
        s: { r: row, c: 0 },
        e: { r: row, c: 5 }
      });
    }
    
    // Merge untuk judul "BUKU EKSPEDISI" (baris 5, r=4)
    worksheet['!merges'].push({
      s: { r: 4, c: 0 },
      e: { r: 4, c: 5 }
    });

    // Merge cell untuk bagian penandatangan
    
    // 1. Bagian Lurah (Kiri) - Kolom A dan B digabung
    // Baris MENGETAHUI
    worksheet['!merges'].push({ s: { r: signStartRowIndex, c: 0 }, e: { r: signStartRowIndex, c: 1 } });
    // Baris JABATAN (LURAH KIAWA DUA BARAT)
    worksheet['!merges'].push({ s: { r: signStartRowIndex, c: 1 }, e: { r: signStartRowIndex, c: 2 } });
    // Baris NAMA
    worksheet['!merges'].push({ s: { r: signStartRowIndex + 9, c: 0 }, e: { r: signStartRowIndex + 9, c: 1 } });
    // Baris NIP
    worksheet['!merges'].push({ s: { r: signStartRowIndex + 9, c: 1 }, e: { r: signStartRowIndex + 9, c: 2 } });
    
    // 2. Bagian Sekretaris (Kanan) - Kolom E dan F digabung
    // Baris TANGGAL
    worksheet['!merges'].push({ s: { r: signStartRowIndex, c: 4 }, e: { r: signStartRowIndex, c: 5 } });
    // Baris JABATAN (SEKRETARIS KIAWA DUA BARAT)
    worksheet['!merges'].push({ s: { r: signStartRowIndex + 1, c: 4 }, e: { r: signStartRowIndex + 1, c: 5 } });
    // Baris NAMA
    worksheet['!merges'].push({ s: { r: signStartRowIndex + 9, c: 4 }, e: { r: signStartRowIndex + 9, c: 5 } });
    // Baris NIP
    worksheet['!merges'].push({ s: { r: signStartRowIndex + 10, c: 4 }, e: { r: signStartRowIndex + 10, c: 5 } });


    // --- STYLING (Untuk Center Alignment) ---
    
    // Helper untuk mendapatkan referensi sel (misal: "A1") dari index baris/kolom
    const getCellRef = (r:any, c:any) => XLSX.utils.encode_cell({ r, c });

    // Set default style (center alignment) untuk Header Instansi, Judul, dan Penandatangan
    const centerStyle = { alignment: { horizontal: "center" } };

    // Header Instansi (Baris 1-3, r=0 ke 2)
    for (let r = 0; r <= 2; r++) {
      const cellRef = getCellRef(r, 0); // Sel A1, A2, A3
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = centerStyle;
      }
    }

    // Judul (Baris 5, r=4)
    const titleCellRef = getCellRef(4, 0); // Sel A5
    if (worksheet[titleCellRef]) {
      worksheet[titleCellRef].s = centerStyle;
    }
    
    // Penandatangan (Baris r = signStartRowIndex hingga akhir)
    
    // 1. Lurah (Kolom A & B)
    for (let r = signStartRowIndex; r <= signStartRowIndex + 10; r++) {
      // Mengetahui, Lurah Kiawa Dua Barat (Merge A-B)
      const refA = getCellRef(r, 0);
      if (worksheet[refA] && worksheet[refA].v) {
        worksheet[refA].s = centerStyle;
      }
      // H YULANDI, NIP (Merge B-C)
      const refB = getCellRef(r, 1);
      if (worksheet[refB] && worksheet[refB].v) {
        worksheet[refB].s = centerStyle;
      }
    }

    // 2. Sekretaris (Kolom E & F)
    for (let r = signStartRowIndex; r <= signStartRowIndex + 10; r++) {
      // Tanggal, Sekretaris, Nama, NIP (Merge E-F)
      const refE = getCellRef(r, 4);
      if (worksheet[refE] && worksheet[refE].v) {
        worksheet[refE].s = centerStyle;
      }
    }

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buku Ekspedisi");

    // Generate buffer Excel
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xls', 
      type: 'buffer',
      cellStyles: true // Pastikan ini true untuk menerapkan styling
    });

    // Format nama file dengan tanggal
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getFullYear()}`;
    const filename = `buku_ekspedisi_${formattedDate}.xls`;

    return new Response(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Excel download error:", error);
    return NextResponse.json({ ok: false, error: "Gagal membuat file Excel" }, { status: 500 });
  }
}