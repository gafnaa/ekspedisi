"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Pencil,
  Trash2,
  DownloadCloud,
  Download,
  X,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// ... keep Button, Modal, Alert components exactly as you already have them ...

// === DATA TYPE (updated) ===
type Row = {
  id: string;
  // no: number;            <-- REMOVE THIS
  tglPengiriman: string | null;
  noSurat: string;
  tglSurat: string; // ISO string
  isiSingkat: string;
  ditujukan: string;
  keterangan: string;
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


export default function TableClient({
  dataEkspedisi,
  itemsPerPage,
  selectedYear,
  searchQuery = "",
}: {
  dataEkspedisi: Row[];
  itemsPerPage: number;
  selectedYear: string;
  searchQuery?: string;
}) {
  const fmt = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const router = useRouter();

  const [notif, setNotif] = useState<{
    color: "success" | "danger";
    title: string;
    description: string;
  } | null>(null);


  // === FILTERING (same as before) ===
  let filteredData = dataEkspedisi;

  if (selectedYear) {
    filteredData = filteredData.filter(
      (item) =>
        new Date(item.tglSurat).getFullYear().toString() === selectedYear,
    );
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredData = filteredData.filter((item) => {
      return (
        item.noSurat.toLowerCase().includes(query) ||
        item.isiSingkat.toLowerCase().includes(query) ||
        item.ditujukan.toLowerCase().includes(query) ||
        item.keterangan.toLowerCase().includes(query) ||
        fmt(item.tglSurat).toLowerCase().includes(query) ||
        fmt(item.tglPengiriman).toLowerCase().includes(query)
      );
    });
  }

  // === PAGINATION STATE ===
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, selectedYear, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Use functional setState to avoid stale closure → fixes "Selanjutnya" not moving
  const handlePreviousPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const showPreviousButton = currentPage > 1;
  const showNextButton = currentPage < totalPages;



const handleConfirmDelete = async (id: string) => {
  // reset notif first
  setNotif(null);

  try {
    const res = await fetch(`/api/surat/${id}`, {
      method: "DELETE",
    });

    const json = await res.json();

    if (!json.ok) {
      setNotif({
        color: "danger",
        title: "Gagal menghapus",
        description: json.error || "Terjadi kesalahan pada server.",
      });
      return;
    }

    // success
    setNotif({
      color: "success",
      title: "Data berhasil dihapus!",
      description: "Data akan diperbarui.",
    });

    // after a short delay, refresh the page data
    setTimeout(() => {
      router.refresh?.(); // Next.js app router revalidate this page
    }, 2000);
  } catch (err) {
    setNotif({
      color: "danger",
      title: "Gagal menghapus",
      description: "Tidak bisa terhubung ke server.",
    });
  }
  router.refresh();
};


  return (
    <div className="overflow-x-auto p-4 font-sans">
      <div className="fixed top-4 sm:top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 sm:w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <Alert
          isVisible={!!notif}
          color={notif?.color || "success"}
          title={notif?.title || ""}
          description={notif?.description || ""}
          onClose={() => setNotif(null)}
        />
      </div>
      {/* ...Modal stays the same... */}

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
          {paginatedData.map((item, idx) => (
            <tr
              key={item.id}
              className="bg-white border-b hover:bg-gray-50"
            >
              {/* No. column is now just row numbering */}
              <td className="px-6 py-4 font-medium">
                {startIndex + idx + 1}
              </td>

              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <a
                    href={`/buku-ekspedisi/form/${item.id}`}
                    title="Ubah Data"
                    className="p-2 bg-yellow-400 text-white rounded-md shadow hover:bg-yellow-500 transition-colors"
                  >
                    <Pencil size={16} />
                  </a>

                  <button
                    title="Hapus Data"
                    onClick={() => handleConfirmDelete(item.id)}
                    className="p-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>

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

      {/* footer / pagination stays mostly the same, but it's now using the fixed handlers */}
      <div className="p-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
        <span>
          Menampilkan {paginatedData.length} dari {filteredData.length} entri
        </span>
        <div className="flex items-center gap-1 mt-2 md:mt-0">
          {showPreviousButton && (
            <button
              type="button"
              onClick={handlePreviousPage}
              className="px-3 py-1 border rounded-md hover:bg-gray-100"
            >
              Sebelumnya
            </button>
          )}

          {totalPages > 0 && (
            <span className="px-3 py-1 border rounded-md bg-blue-600 text-white">
              {currentPage}
            </span>
          )}

          {showNextButton && (
            <button
              type="button"
              onClick={handleNextPage}
              className="px-3 py-1 border rounded-md hover:bg-gray-100"
            >
              Selanjutnya
            </button>
          )}
        </div>
      </div>

      {/* alerts + modal footer unchanged */}
      {/* ... keep the rest of your Alert + Modal rendering ... */}
    </div>
  );
}
