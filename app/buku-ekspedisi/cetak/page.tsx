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

export default function BukuEkspedisiCetak() {
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
        <h2 className="font-semibold text-base">BUKU EKSPEDISI SURAT KELUAR</h2>
        <hr className="my-3 border-black" />
      </div>

      {/* Tabel */}
      <table className="w-full border border-black border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2">NO URUT</th>
            <th className="border border-black p-2">TGL PENGIRIMAN</th>
            <th className="border border-black p-2">TGL & NO SURAT</th>
            <th className="border border-black p-2">ISI SINGKAT SURAT</th>
            <th className="border border-black p-2">DITUJUKAN KEPADA</th>
            <th className="border border-black p-2">KETERANGAN</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={item.id}>
              <td className="border border-black p-2 text-center">
                {item.nomorUrut ?? i + 1}
              </td>
              <td className="border border-black p-2 text-center">
                {item.tanggalKirim ? item.tanggalKirim.split("T")[0] : "-"}
              </td>
              <td className="border border-black p-2 text-center">
                {item.tanggalSurat?.split("T")[0] || "-"} <br />
                {item.nomorSurat}
              </td>
              <td className="border border-black p-2">{item.perihal}</td>
              <td className="border border-black p-2">{item.tujuan}</td>
              <td className="border border-black p-2">{item.keterangan}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tanda tangan */}
      <div className="flex justify-between mt-12 text-sm">
        <div>
          <p>Mengetahui,</p>
          <p className="font-semibold">Kepala Desa Kiawa Dua Barat</p>
          <br />
          <br />
          <p>(_________________)</p>
        </div>
        <div className="text-right">
          <p>Kiawa Dua Barat, {new Date().toLocaleDateString("id-ID")}</p>
          <p className="font-semibold">Sekretaris Desa</p>
          <br />
          <br />
          <p>(_________________)</p>
        </div>
      </div>

      {/* Tombol cetak */}
      <div className="absolute top-6 right-8 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Cetak Halaman Ini
        </button>
      </div>
    </div>
  );
}
