'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- PERBAIKAN: Impor useRouter
import {
  ArrowLeft,
  Home,
  ChevronRight,
  CalendarDays,
  Upload,
  Save,
  X,
} from 'lucide-react';

// Tentukan tipe data untuk form
interface FormData {
  nomorUrut: string;
  kodeSurat: string;
  nomorSurat: string;
  tanggalSurat: string;
  tujuan: string;
  isiSingkat: string;
  tanggalPengiriman: string;
  berkas: File | null;
  keterangan: string;
}

// Tipe untuk props, kita terima dataAwal opsional
interface BukuEkspedisiFormProps {
  dataAwal?: Partial<FormData>; // Partial berarti semua properti opsional
  isEditMode: boolean;
}

export default function BukuEkspedisiForm({
  dataAwal,
  isEditMode,
}: BukuEkspedisiFormProps) {
  
  const router = useRouter(); // <-- PERBAIKAN: Panggil hook router

  // State untuk menampung data form
  const [formData, setFormData] = useState<FormData>({
    nomorUrut: '',
    kodeSurat: '',
    nomorSurat: '',
    tanggalSurat: '',
    tujuan: '',
    isiSingkat: '',
    tanggalPengiriman: '',
    berkas: null,
    keterangan: '',
  });

  // useEffect ini akan mengisi form jika kita dalam mode Edit
  useEffect(() => {
    if (isEditMode && dataAwal) {
      // Mengisi state dengan data awal
      setFormData((prev) => ({
        ...prev,
        ...dataAwal,
        // Pastikan format tanggal sesuai untuk input type="date" (YYYY-MM-DD)
        tanggalSurat: dataAwal.tanggalSurat
          ? new Date(dataAwal.tanggalSurat).toISOString().split('T')[0]
          : '',
        tanggalPengiriman: dataAwal.tanggalPengiriman
          ? new Date(dataAwal.tanggalPengiriman).toISOString().split('T')[0]
          : '',
      }));
    }
  }, [isEditMode, dataAwal]);

  // Handler untuk mengubah state saat input diisi
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler untuk input file
  // <-- PERBAIKAN: Pengecekan 'e.target.files' yang aman
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Hanya jika file ada, kita set state
      setFormData((prev) => ({
        ...prev,
        berkas: e.target.files![0],
      }));
    } else {
      // Opsional: jika pengguna batal memilih, set berkas ke null
      setFormData((prev) => ({
        ...prev,
        berkas: null,
      }));
    }
  };

  // Handler saat form disubmit
  // <-- PERBAIKAN: Menambahkan router.push()
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Di sini logika untuk mengirim data (formData) ke API
    if (isEditMode) {
      console.log('Mengupdate data:', formData);
      // Panggil API UPDATE (PUT/PATCH) di sini
    } else {
      console.log('Menyimpan data baru:', formData);
      // Panggil API CREATE (POST) di sini
    }
    
    // Setelah submit, tampilkan alert dan navigasi kembali ke halaman daftar
    alert(isEditMode ? 'Data berhasil diubah!' : 'Data berhasil disimpan!');
    router.push('/buku-ekspedisi');
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      {/* Header Halaman (Breadcrumbs & Tombol Kembali) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {isEditMode ? 'Ubah Data Ekspedisi' : 'Tambah Data Ekspedisi'}
          </h1>
          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-blue-600">
              <Home size={16} />
            </Link>
            <ChevronRight size={16} className="mx-1" />
            <Link href="/buku-ekspedisi" className="hover:text-blue-600">
              Buku Ekspedisi
            </Link>
            <ChevronRight size={16} className="mx-1" />
            <span className="font-medium text-gray-700">Form Ekspedisi</span>
          </nav>
        </div>

        <Link href="/buku-ekspedisi">
          <button className="mt-2 md:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg shadow hover:bg-cyan-700 transition-colors">
            <ArrowLeft size={18} />
            Kembali Ke Buku Ekspedisi
          </button>
        </Link>
      </div>

      {/* Konten Form dalam Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="bg-orange-400 p-4 rounded-t-lg">
          {/* Header Card Kosong Sesuai Gambar */}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Baris Form (Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
            {/* Label */}
            <label htmlFor="nomorUrut" className="text-sm font-medium text-gray-700 md:text-right pt-2">
              Nomor Urut
            </label>
            {/* Input */}
            <div className="md:col-span-2">
              <input
                type="number"
                id="nomorUrut"
                name="nomorUrut"
                value={formData.nomorUrut}
                onChange={handleChange}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Label */}
            <label htmlFor="kodeSurat" className="text-sm font-medium text-gray-700 md:text-right pt-2">
              Kode/Klasifikasi Surat
            </label>
            {/* Input */}
            <div className="md:col-span-2">
              <select
                id="kodeSurat"
                name="kodeSurat"
                value={formData.kodeSurat}
                onChange={handleChange}
                className="w-full md:w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Kode/Klasifikasi Surat --</option>
                <option value="A.1">A.1 - Undangan</option>
                <option value="B.2">B.2 - Edaran</option>
              </select>
            </div>

            {/* Label */}
            <label htmlFor="nomorSurat" className="text-sm font-medium text-gray-700 md:text-right pt-2">
              Nomor Surat
            </label>
            {/* Input */}
            <div className="md:col-span-2">
              <input
                type="text"
                id="nomorSurat"
                name="nomorSurat"
                value={formData.nomorSurat}
                onChange={handleChange}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Label */}
            <label htmlFor="tanggalSurat" className="text-sm font-medium text-gray-700 md:text-right pt-2">
              Tanggal Surat
            </label>
            {/* Input */}
            <div className="md:col-span-2">
              <div className="relative w-full md:w-1/3">
                <input
                  type="date"
                  id="tanggalSurat"
                  name="tanggalSurat"
                  value={formData.tanggalSurat}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <CalendarDays
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Label */}
            <label htmlFor="tujuan" className="text-sm font-medium text-gray-700 md:text-right pt-2">
              Tujuan
            </label>
            {/* Input */}
            <div className="md:col-span-2">
              <input
                type="text"
                id="tujuan"
                name="tujuan"
                value={formData.tujuan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Label */}
            <label htmlFor="isiSingkat" className="text-sm font-medium text-gray-700 md:text-right pt-2">
              Isi Singkat/Perihal
            </label>
            {/* Input */}
            <div className="md:col-span-2">
              <textarea
                id="isiSingkat"
                name="isiSingkat"
                rows={3}
                value={formData.isiSingkat}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Label */}
            <label htmlFor="tanggalPengiriman" className="text-sm font-medium text-gray-700 md:text-right pt-2">
              Tanggal Pengiriman
            </label>
            {/* Input */}
            <div className="md:col-span-2">
               <div className="relative w-full md:w-1/3">
                <input
                  type="date"
                  id="tanggalPengiriman"
                  name="tanggalPengiriman"
                  value={formData.tanggalPengiriman}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <CalendarDays
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Label */}
            <label htmlFor="berkas" className="text-sm font-medium text-gray-700 md:text-right pt-2">
              Berkas Scan Tanda Terima
            </label>
            {/* Input */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="berkas"
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg border border-blue-300 hover:bg-blue-200"
                >
                  <Upload size={18} />
                  Browse
                </label>
                <input
                  type="file"
                  id="berkas"
                  name="berkas"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-gray-500 text-sm">
                  {formData.berkas ? formData.berkas.name : 'No file chosen'}
                </span>
              </div>
              <p className="text-xs text-red-500 mt-1">
                (Kosongkan jika tidak ingin mengubah berkas)
              </p>
            </div>

            {/* Label */}
            <label htmlFor="keterangan" className="text-sm font-medium text-gray-700 md:text-right pt-2">
              Keterangan
            </label>
            {/* Input */}
            <div className="md:col-span-2">
              <textarea
                id="keterangan"
                name="keterangan"
                rows={3}
                value={formData.keterangan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Form (Tombol Simpan & Batal) */}
          <div className="border-t border-gray-200 pt-6 flex justify-end gap-3">
            <Link href="/buku-ekspedisi">
              <button
                type="button" // Tipe 'button' agar tidak mensubmit form
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors"
              >
                <X size={18} />
                Batal
              </button>
            </Link>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              <Save size={18} />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}