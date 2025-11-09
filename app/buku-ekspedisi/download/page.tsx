"use client";
import { useEffect, useState } from "react";

interface SuratKeluar {
  id: string;
  nomorUrut: number | null;
  tanggalKirim: string | null;
  tanggalSurat: string | null;
  nomorSurat: string | null;
  perihal: string | null;
  tujuan: string | null;
  keterangan: string | null;
}

export default function BukuEkspedisiDownload() {
  const [data, setData] = useState<SuratKeluar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/surat/cetak")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Memuat data...</p>;
  }

  return (
    <div className="p-10 text-sm text-black">
      {/* Kop Surat */}
      <div className="text-center mb-6">
        <h1 className="font-bold text-lg">PEMERINTAH DESA KIAWA DUA BARAT</h1>
        <h2 className="font-semibold text-base">DAFTAR SURAT KELUAR</h2>
        <hr className="my-3 border-black" />
      </div>

      {/* Tabel Surat */}
      <table className="w-full border border-black border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2">NO URUT</th>
            <th className="border border-black p-2">TGL SURAT</th>
            <th className="border border-black p-2">NO SURAT</th>
            <th className="border border-black p-2">PERIHAL</th>
            <th className="border border-black p-2">TUJUAN</th>
            <th className="border border-black p-2">KETERANGAN</th>
            <th className="border border-black p-2">AKSI</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={item.id}>
              <td className="border border-black p-2 text-center">
                {item.nomorUrut ?? i + 1}
              </td>
              <td className="border border-black p-2 text-center">
                {item.tanggalSurat?.split("T")[0] || "-"}
              </td>
              <td className="border border-black p-2 text-center">
                {item.nomorSurat ?? "-"}
              </td>
              <td className="border border-black p-2">{item.perihal}</td>
              <td className="border border-black p-2">{item.tujuan}</td>
              <td className="border border-black p-2">{item.keterangan}</td>
              <td className="border border-black p-2 text-center">
                <a
                  href={`/api/surat/${item.id}/download`}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Catatan */}
      <div className="mt-8 text-gray-700 text-xs">
        <p>* Klik tombol "Download" untuk mengunduh surat keluar dalam format PDF.</p>
      </div>
    </div>
  );
}
