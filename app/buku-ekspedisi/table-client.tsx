"use client";

import React, { useState } from "react";
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

  // notification + modal state stays the same...
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const handleOpenConfirmModal = (id: string) => {
    setItemToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setItemToDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;

    const res = await fetch(`/api/surat/${itemToDeleteId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setErrorAlertVisible(true);
    } else {
      setSuccessAlertVisible(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }

    setIsConfirmModalOpen(false);
    setItemToDeleteId(null);
  };

  return (
    <div className="overflow-x-auto p-4 font-sans">
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
                    onClick={() => handleOpenConfirmModal(item.id)}
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
