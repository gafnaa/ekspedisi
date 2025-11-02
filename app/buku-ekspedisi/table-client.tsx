"use client";

import React, { useState } from "react";
// import Link from "next/link"; // Dihapus - diganti dengan <a>
// import { useRouter } from "next/navigation"; // Dihapus - diganti dengan window.location.reload
// import { Alert, Modal, Button } from "@heroui/react"; // Dihapus - dibuat ulang di bawah
import {
  AlertTriangle,
  ArrowUpDown, // Ditambahkan untuk ikon modal
  CheckCircle,
  Download,
  DownloadCloud,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

// === KOMPONEN UI DIBUAT ULANG ===
// Dibuat ulang untuk menggantikan @heroui/react

/**
 * Komponen Button kustom
 */
const Button = ({
  onClick,
  color = "primary",
  children,
}: {
  onClick: () => void;
  color: "primary" | "light" | "danger";
  children: React.ReactNode;
}) => {
  const colorClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    light: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md shadow-sm font-medium transition-colors ${colorClasses[color]}`}
    >
      {children}
    </button>
  );
};

/**
 * Komponen Modal kustom (DIMODIFIKASI)
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    // Overlay dengan backdrop blur (opasitas diubah ke 10% dan blur-md)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-md transition-opacity duration-300">
      {/* Konten Modal */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        {/* Tombol Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Konten di tengah */}
        <div className="flex flex-col items-center text-center">
          {/* Ikon Peringatan */}
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>

          {/* Judul (Diubah: ditambahkan text-black) */}
          <h3 className="text-xl font-semibold mb-2 text-black">{title}</h3>

          {/* Children (deskripsi + tombol) */}
          {children}
        </div>
      </div>
      {/* Menambahkan style untuk animasi fade-in */}
      <style>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

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
        // Ditambahkan w-full dan shadow-lg
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none" // Transisi masuk dan keluar
      }`}
      role="alert"
    >
      {/* Ikon */}
      <div className="flex-shrink-0 pt-0.5">{icons[color]}</div>

      {/* Konten Teks */}
      <div className="flex-grow">
        <strong className="font-bold">{title}</strong>
        {description && <p className="text-sm mt-1">{description}</p>}
      </div>

      {/* Tombol Close */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/10 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};

// === AKHIR DARI KOMPONEN UI ===

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

export default function TableClient({
  dataEkspedisi,
}: {
  dataEkspedisi: Row[];
}) {
  // const router = useRouter(); // Dihapus

  const fmt = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // State untuk notifikasi error
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  // State untuk notifikasi sukses (Ditambahkan)
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);

  // State untuk modal konfirmasi
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // Fungsi untuk membuka modal konfirmasi
  const handleOpenConfirmModal = (id: string) => {
    setItemToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  // Fungsi untuk menutup modal konfirmasi (membatalkan)
  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setItemToDeleteId(null);
  };

  // Fungsi untuk mengeksekusi penghapusan setelah konfirmasi
  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;

    const res = await fetch(`/api/surat/${itemToDeleteId}`, {
      method: "DELETE",
    });
    console.log("id : ", itemToDeleteId);

    if (!res.ok) {
      setErrorAlertVisible(true); // Tampilkan alert error jika gagal
    } else {
      // router.refresh(); // Diganti dengan window.location.reload()

      setSuccessAlertVisible(true); // Tampilkan notifikasi sukses

      // Muat ulang halaman setelah 2 detik agar notifikasi terbaca
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }

    // Tutup modal setelah selesai
    setIsConfirmModalOpen(false);
    setItemToDeleteId(null);
  };

  return (
    <div className="overflow-x-auto p-4 font-sans">
      {/* Modal untuk konfirmasi hapus (DIMODIFIKASI) */}
      <Modal
        title="Konfirmasi Hapus"
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
      >
        {/* Konten children untuk modal, akan dipusatkan secara otomatis */}
        <p className="text-gray-600 mb-6 px-4">
          Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat
          dibatalkan.
        </p>
        <div className="flex justify-center gap-3 w-full">
          <Button color="light" onClick={handleCancelDelete}>
            Batal
          </Button>
          <Button color="danger" onClick={handleConfirmDelete}>
            Ya, Hapus
          </Button>
        </div>
      </Modal>

      {/* Tabel Data */}
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th className="px-6 py-3">No.</th>
            <th className="px-6 py-3">Aksi</th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">
                Tgl Pengiriman <ArrowUpDown size={14} />
              </div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">
                No. Surat <ArrowUpDown size={14} />
              </div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">
                Tanggal Surat <ArrowUpDown size={14} />
              </div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">
                Isi Singkat <ArrowUpDown size={14} />
              </div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">
                Ditujukan Kepada <ArrowUpDown size={14} />
              </div>
            </th>
            <th className="px-6 py-3">
              <div className="flex items-center gap-1">
                Keterangan <ArrowUpDown size={14} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {dataEkspedisi.map((item) => (
            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{item.no}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {/* Ubah - Menggunakan <a> standar */}
                  <a
                    href={`/buku-ekspedisi/${item.id}`}
                    title="Ubah Data"
                    className="p-2 bg-yellow-400 text-white rounded-md shadow hover:bg-yellow-500 transition-colors"
                  >
                    <Pencil size={16} />
                  </a>

                  {/* Hapus (soft delete) */}
                  <button
                    title="Hapus Data"
                    onClick={() => handleOpenConfirmModal(item.id)} // Diubah untuk memanggil modal
                    className="p-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition-colors" // Warna diubah menjadi merah
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Contoh tombol tambahan */}
                  <button
                    title="Download"
                    onClick={() => window.open(`/api/surat/${item.id}/download`, "_blank")}
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

      {/* Kontainer Notifikasi (Kanan Bawah) */}
      <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
        {/* Alert untuk notifikasi error */}
        <Alert
          color="danger"
          title="Gagal menghapus data"
          description="Terjadi kesalahan saat mencoba menghapus data."
          isVisible={errorAlertVisible}
          onClose={() => setErrorAlertVisible(false)}
        />

        {/* Alert untuk notifikasi sukses (Ditambahkan) */}
        <Alert
          color="success"
          title="Data berhasil dihapus"
          description="Data Anda telah berhasil dihapus dari sistem."
          isVisible={successAlertVisible}
          onClose={() => setSuccessAlertVisible(false)}
        />
      </div>
    </div>
  );
}
