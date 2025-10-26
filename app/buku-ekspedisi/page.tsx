// Tambahkan 'use client' di atas karena kita akan membuat fungsi
// untuk tombol Hapus yang memerlukan interaktivitas di browser.
'use client';


import Link from 'next/link';
import {
  Printer,
  Download,
  Plus,
  Search,
  ArrowUpDown,
  Pencil,
  Trash2,
  DownloadCloud,
} from 'lucide-react';

// Mock data (data tiruan) sesuai gambar
const dataEkspedisi = [
  {
    id: 1,
    no: 1,
    tglPengiriman: null,
    noSurat: 34,
    tglSurat: '10 September 2025',
    isiSingkat: 'tegar',
    ditujukan: 'dzikran',
    keterangan: '-',
  },
  {
    id: 2,
    no: 2,
    tglPengiriman: '07 September 2025',
    noSurat: 23,
    tglSurat: '13 Agustus 2025',
    isiSingkat: 'dsa',
    ditujukan: 'ds',
    keterangan: 'tes',
  },
];

export default function BukuEkspedisiPage() {
  // Fungsi ini akan dijalankan saat tombol hijau (Hapus) diklik
  const handleDelete = (id: number) => {
    // Tampilkan konfirmasi sebelum menghapus
    if (window.confirm(`Apakah Anda yakin ingin menghapus data dengan ID: ${id}?`)) {
      // Di sini logika untuk memanggil API penghapusan data
      console.log('Menghapus data...', id);
      // Setelah berhasil, kamu bisa muat ulang data atau menghapus
      // item dari state
    }
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">
        Buku Ekspedisi
      </h1>

      {/* Area Tombol Aksi Atas */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        {/* Tombol TAMBAH DATA baru */}
        <Link href="/buku-ekspedisi/form">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors w-full md:w-auto">
            <Plus size={18} />
            Tambah Data
          </button>
        </Link>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition-colors w-full md:w-auto">
          <Printer size={18} />
          Cetak
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg shadow hover:bg-slate-800 transition-colors w-full md:w-auto">
          <Download size={18} />
          Unduh
        </button>
      </div>

      {/* Card untuk filter dan tabel */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Area Filter dan Pencarian */}
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Tahun</option>
              <option>2025</option>
              <option>2024</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-gray-600">entri</span>
          </div>

          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="kata kunci pencarian"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3">
                  No.
                </th>
                <th scope="col" className="px-6 py-3">
                  Aksi
                </th>
                <th scope="col" className="px-6 py-3">
                  <div className="flex items-center gap-1">
                    Tgl Pengiriman <ArrowUpDown size={14} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">
                  <div className="flex items-center gap-1">
                    No. Surat <ArrowUpDown size={14} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">
                  <div className="flex items-center gap-1">
                    Tanggal Surat <ArrowUpDown size={14} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">
                  <div className="flex items-center gap-1">
                    Isi Singkat <ArrowUpDown size={14} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">
                  <div className="flex items-center gap-1">
                    Ditujukan Kepada <ArrowUpDown size={14} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">
                  <div className="flex items-center gap-1">
                    Keterangan <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {dataEkspedisi.map((item) => (
                <tr
                  key={item.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium">{item.no}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {/* Tombol UBAH (Kuning) */}
                      <Link href={`/buku-ekspedisi/form/${item.id}`}>
                        <button
                          title="Ubah Data"
                          className="p-2 bg-yellow-400 text-white rounded-md shadow hover:bg-yellow-500 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                      </Link>
                      
                      {/* Tombol HAPUS (Hijau) */}
                      <button
                        title="Hapus Data"
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Tombol-tombol lain dari gambar */}
                      {item.id === 2 && (
                        <>
                          <button
                            title="Download"
                            className="p-2 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700 transition-colors"
                          >
                            <DownloadCloud size={16} />
                          </button>
                          <button
                            title="Aksi Lain"
                            className="p-2 bg-teal-500 text-white rounded-md shadow hover:bg-teal-600 transition-colors"
                          >
                            <Download size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.tglPengiriman || '-'}
                  </td>
                  <td className="px-6 py-4">{item.noSurat}</td>
                  <td className="px-6 py-4">{item.tglSurat}</td>
                  <td className="px-6 py-4">{item.isiSingkat}</td>
                  <td className="px-6 py-4">{item.ditujukan}</td>
                  <td className="px-6 py-4">{item.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Tabel (Info dan Paginasi) */}
        <div className="p-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <span>Menampilkan 1 sampai 2 dari 2 entri</span>
          <div className="flex items-center gap-1 mt-2 md:mt-0">
            <button className="px-3 py-1 border rounded-md hover:bg-gray-100">
              Sebelumnya
            </button>
            <button className="px-3 py-1 border rounded-md bg-blue-600 text-white">
              1
            </button>
            <button className="px-3 py-1 border rounded-md hover:bg-gray-100">
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}