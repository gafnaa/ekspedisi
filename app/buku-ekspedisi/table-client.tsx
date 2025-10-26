// app/buku-ekspedisi/table-client.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, Pencil, Trash2, DownloadCloud, Download } from 'lucide-react';

type Row = {
  id: string;
  no: number;
  tglPengiriman: string | null;
  noSurat: string;
  tglSurat: string; // ISO
  isiSingkat: string;
  ditujukan: string;
  keterangan: string;
};

export default function TableClient({ dataEkspedisi }: { dataEkspedisi: Row[] }) {
  const router = useRouter();

  const fmt = (iso?: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data dengan ID: ${id}?`)) return;
    const res = await fetch(`/api/surat/${id}`, { method: 'DELETE' });
    console.log("id : ", id);
    if (!res.ok) {
      alert('Gagal menghapus data');
      return;
    }
    router.refresh(); // re-fetch server component
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th className="px-6 py-3">No.</th>
            <th className="px-6 py-3">Aksi</th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">Tgl Pengiriman <ArrowUpDown size={14} /></div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">No. Surat <ArrowUpDown size={14} /></div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">Tanggal Surat <ArrowUpDown size={14} /></div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">Isi Singkat <ArrowUpDown size={14} /></div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">Ditujukan Kepada <ArrowUpDown size={14} /></div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">Keterangan <ArrowUpDown size={14} /></div>
            </th>
          </tr>
        </thead>
        <tbody>
          {dataEkspedisi.map((item) => (
            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{item.no}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {/* Ubah */}
                  <Link href={`/buku-ekspedisi/form/${item.id}`}>
                    <button title="Ubah Data" className="p-2 bg-yellow-400 text-white rounded-md shadow hover:bg-yellow-500 transition-colors">
                      <Pencil size={16} />
                    </button>
                  </Link>

                  {/* Hapus (soft delete) */}
                  <button
                    title="Hapus Data"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Contoh tombol tambahan */}
                  <button title="Download" className="p-2 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700 transition-colors">
                    <DownloadCloud size={16} />
                  </button>
                  <button title="Aksi Lain" className="p-2 bg-teal-500 text-white rounded-md shadow hover:bg-teal-600 transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              </td>
              <td className="px-6 py-4">{fmt(item.tglPengiriman)}</td>
              <td className="px-6 py-4">{item.noSurat}</td>
              <td className="px-6 py-4">{fmt(item.tglSurat)}</td>
              <td className="px-6 py-4">{item.isiSingkat}</td>
              <td className="px-6 py-4">{item.ditujukan}</td>
              <td className="px-6 py-4">{item.keterangan}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
