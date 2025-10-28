"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link"; // Dikembalikan
import { useRouter } from "next/navigation"; // Dikembalikan
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Home,
  Save,
  Upload,
  X,
  AlertTriangle, // Untuk Notifikasi
  CheckCircle, // Untuk Notifikasi
} from "lucide-react";

// --- KOMPONEN SHADCN/UI (DIASUMSIKAN ADA) ---
// Impor ini harus sesuai dengan struktur proyek Anda
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// ---

// === KOMPONEN ALERT KUSTOM (dari file table-client.tsx) ===
/**
 * Komponen Alert kustom
 */
const Alert = ({
  isVisible,
  onClose,
  title,
  description,
  color = "danger",
}: {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  color: "danger" | "success";
}) => {
  const colorClasses = {
    danger: {
      bg: "bg-red-50",
      border: "border-red-400",
      text: "text-red-700",
      icon: "text-red-600",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-400",
      text: "text-green-700",
      icon: "text-green-600",
    },
  };

  const icons = {
    danger: <AlertTriangle size={20} className={colorClasses.danger.icon} />,
    success: <CheckCircle size={20} className={colorClasses.success.icon} />,
  };

  const selectedColor = colorClasses[color];

  return (
    <div
      className={`border ${selectedColor.bg} ${selectedColor.border} ${
        selectedColor.text
      } rounded-md p-4 mb-4 relative flex gap-3 items-start transition-all duration-300 ease-in-out w-full shadow-lg ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
      role="alert"
    >
      <div className="flex-shrink-0 pt-0.5">{icons[color]}</div>
      <div className="flex-grow">
        <strong className="font-bold">{title}</strong>
        {description && <p className="text-sm mt-1">{description}</p>}
      </div>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/10 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};
// === AKHIR DARI KOMPONEN ALERT ===

// === HELPER FUNGSI TANGGAL ===
const toYYYYMMDD = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const formatDisplayDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "Pilih tanggal";
  try {
    // Membuat tanggal dalam UTC untuk menghindari masalah timezone
    const parts = dateString.split("-").map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC", // Pastikan konsisten
    });
  } catch (e) {
    return "Tanggal tidak valid";
  }
};

// === KOMPONEN DATE PICKER (berdasarkan referensi shadcn) ===
function DatePickerComponent({
  value,
  onSelect,
}: {
  value: string; // value adalah string YYYY-MM-DD
  onSelect: (date: string) => void; // onSelect mengembalikan string YYYY-MM-DD
}) {
  const [open, setOpen] = React.useState(false);

  // Konversi string YYYY-MM-DD ke objek Date untuk kalender
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    try {
      const parts = value.split("-").map(Number);
      // Gunakan UTC untuk konsistensi
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    } catch (e) {
      return undefined;
    }
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Menggunakan Button dari shadcn/ui */}
        <Button
          variant={"outline"}
          className={`w-full justify-start text-left font-normal ${
            !value ? "text-gray-500" : "text-black"
          } bg-white border-gray-300 hover:bg-gray-50`}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {formatDisplayDate(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onSelect(toYYYYMMDD(date)); // Kembalikan sebagai YYYY-MM-DD
            }
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
// === AKHIR DARI KOMPONEN DATE PICKER ===

// --- KOMPONEN FORM UTAMA ---

// Tentukan tipe data untuk form
interface FormData {
  nomorUrut: string;
  kodeSurat: string;
  nomorSurat: string;
  tanggalSurat: string; // Tetap YYYY-MM-DD
  tujuan: string;
  isiSingkat: string;
  tanggalPengiriman: string; // Tetap YYYY-MM-DD
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
  const router = useRouter(); // Dikembalikan

  // State untuk menampung data form
  const [formData, setFormData] = useState<FormData>({
    nomorUrut: "",
    kodeSurat: "",
    nomorSurat: "",
    tanggalSurat: "",
    tujuan: "",
    isiSingkat: "",
    tanggalPengiriman: "",
    berkas: null,
    keterangan: "",
  });

  // State untuk notifikasi (menggantikan alert)
  const [notif, setNotif] = useState<{
    color: "success" | "danger";
    title: string;
    description: string;
  } | null>(null);

  // useEffect ini akan mengisi form jika kita dalam mode Edit
  useEffect(() => {
    if (isEditMode && dataAwal) {
      // Mengisi state dengan data awal
      setFormData((prev) => ({
        ...prev,
        ...dataAwal,
        // Pastikan format tanggal sesuai untuk input (YYYY-MM-DD)
        tanggalSurat: dataAwal.tanggalSurat
          ? new Date(dataAwal.tanggalSurat).toISOString().split("T")[0]
          : "",
        tanggalPengiriman: dataAwal.tanggalPengiriman
          ? new Date(dataAwal.tanggalPengiriman).toISOString().split("T")[0]
          : "",
      }));
    }
  }, [isEditMode, dataAwal]);

  // Handler untuk mengubah state saat input diisi
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler khusus untuk DatePicker
  const handleDateSelect = (
    name: "tanggalSurat" | "tanggalPengiriman",
    date: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  // Handler untuk input file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        berkas: e.target.files![0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        berkas: null,
      }));
    }
  };

  // Handler saat form disubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null); // Bersihkan notif lama

    const payload = {
      nomorUrut: Number(formData.nomorUrut) || undefined,
      nomorSurat: formData.nomorSurat,
      tanggalSurat: formData.tanggalSurat,
      tanggalKirim: formData.tanggalPengiriman,
      perihal: formData.isiSingkat,
      tujuan: formData.tujuan,
      keterangan: formData.keterangan || null,
      userId: "4cecc9e3-f026-48b4-910f-7cbd895a6d3e", // TODO: nanti pakai auth beneran
    };

    const res = await fetch("/api/surat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!json.ok) {
      // Ganti alert dengan notifikasi
      setNotif({
        color: "danger",
        title: "Gagal menyimpan",
        description: json.error || "Terjadi kesalahan pada server.",
      });
      return;
    }

    // Ganti alert dengan notifikasi
    setNotif({
      color: "success",
      title: "Data berhasil disimpan!",
      description: "Anda akan dialihkan kembali ke halaman utama.",
    });

    // Alihkan setelah notifikasi terlihat
    setTimeout(() => {
      router.push("/buku-ekspedisi"); // Dikembalikan
    }, 2000);
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen text-black">
      {/* Kontainer Notifikasi (Kanan Atas) */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
        <Alert
          isVisible={!!notif}
          color={notif?.color || "success"}
          title={notif?.title || ""}
          description={notif?.description || ""}
          onClose={() => setNotif(null)}
        />
      </div>

      {/* Header Halaman (Breadcrumbs & Tombol Kembali) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-black">
            {isEditMode ? "Ubah Data Ekspedisi" : "Tambah Data Ekspedisi"}
          </h1>
          {/* Breadcrumbs (Dikembalikan ke <Link>) */}
          <nav
            className="flex items-center text-sm text-black"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-blue-600">
              <Home size={16} />
            </Link>
            <ChevronRight size={16} className="mx-1" />
            <Link href="/buku-ekspedisi" className="hover:text-blue-600">
              Buku Ekspedisi
            </Link>
            <ChevronRight size={16} className="mx-1" />
            <span className="font-medium text-black">Form Ekspedisi</span>
          </nav>
        </div>

        {/* Tombol Kembali (Dikembalikan ke <Link>) */}
        <Link href="/buku-ekspedisi">
          <button className="mt-2 md:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg shadow hover:bg-cyan-700 transition-colors">
            <ArrowLeft size={18} />
            Kembali Ke Buku Ekspedisi
          </button>
        </Link>
      </div>

      {/* Konten Form dalam Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 text-black">
        <div className="bg-orange-400 p-4 rounded-t-lg">
          {/* Header Card Kosong Sesuai Gambar */}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Baris Form (Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
            {/* Nomor Urut */}
            <label
              htmlFor="nomorUrut"
              className="text-sm font-medium text-black md:text-right pt-2"
            >
              Nomor Urut
            </label>
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

            {/* Kode/Klasifikasi Surat */}
            <label
              htmlFor="kodeSurat"
              className="text-sm font-medium text-black md:text-right pt-2"
            >
              Kode/Klasifikasi Surat
            </label>
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

            {/* Nomor Surat */}
            <label
              htmlFor="nomorSurat"
              className="text-sm font-medium text-black md:text-right pt-2"
            >
              Nomor Surat
            </label>
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

            {/* Tanggal Surat (DIGANTI DENGAN DATEPICKER) */}
            <label
              htmlFor="tanggalSurat"
              className="text-sm font-medium text-black md:text-right pt-2"
            >
              Tanggal Surat
            </label>
            <div className="md:col-span-2 w-full md:w-1/3">
              <DatePickerComponent
                value={formData.tanggalSurat}
                onSelect={(date) => handleDateSelect("tanggalSurat", date)}
              />
            </div>

            {/* Tujuan */}
            <label
              htmlFor="tujuan"
              className="text-sm font-medium text-black md:text-right pt-2"
            >
              Tujuan
            </label>
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

            {/* Isi Singkat/Perihal */}
            <label
              htmlFor="isiSingkat"
              className="text-sm font-medium text-black md:text-right pt-2"
            >
              Isi Singkat/Perihal
            </label>
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

            {/* Tanggal Pengiriman (DIGANTI DENGAN DATEPICKER) */}
            <label
              htmlFor="tanggalPengiriman"
              className="text-sm font-medium text-black md:text-right pt-2"
            >
              Tanggal Pengiriman
            </label>
            <div className="md:col-span-2 w-full md:w-1/3">
              <DatePickerComponent
                value={formData.tanggalPengiriman}
                onSelect={(date) => handleDateSelect("tanggalPengiriman", date)}
              />
            </div>

            {/* Berkas Scan Tanda Terima */}
            <label
              htmlFor="berkas"
              className="text-sm font-medium text-black md:text-right pt-2"
            >
              Berkas Scan Tanda Terima
            </label>
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
                <span className="text-black text-sm">
                  {formData.berkas ? formData.berkas.name : "No file chosen"}
                </span>
              </div>
              <p className="text-xs text-red-500 mt-1">
                (Kosongkan jika tidak ingin mengubah berkas)
              </p>
            </div>

            {/* Keterangan */}
            <label
              htmlFor="keterangan"
              className="text-sm font-medium text-black md:text-right pt-2"
            >
              Keterangan
            </label>
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
            {/* Tombol Batal (Dikembalikan ke <Link>) */}
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
