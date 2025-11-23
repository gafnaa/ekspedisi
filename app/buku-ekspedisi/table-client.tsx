"use client";

import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle,
  Download,
  DownloadCloud,
  Pencil,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { SuratEkspedisi } from "@/app/buku-ekspedisi/types";

/* Reusable button */
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
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-md shadow-sm font-medium transition-colors ${colorClasses[color]}`}
    >
      {children}
    </button>
  );
};

/* Modal (confirm delete) */
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        {/* Close (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>

          <h3 className="text-xl font-semibold mb-2 text-black">{title}</h3>

          {children}
        </div>
      </div>

      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

/* Toast alert (success / error bottom-right) */
const AlertToast = ({
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
      className={`border ${selectedColor.bg} ${selectedColor.border} ${selectedColor.text} rounded-md p-4 mb-4 relative flex gap-3 items-start transition-all duration-300 ease-in-out w-full shadow-lg ${isVisible
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
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/10 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};

/* Fullscreen image preview modal (lightbox) */
const ImagePreviewModal = ({
  isOpen,
  onClose,
  imgUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  imgUrl: string | null;
}) => {
  if (!isOpen || !imgUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* stop click bubbling on the inner box so clicking image doesn't instantly close */}
      <div
        className="relative max-w-[90vw] max-h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full p-2 hover:bg-black/80"
          title="Tutup"
        >
          <X size={20} />
        </button>

        {/* The big image */}
        <img
          src={imgUrl}
          alt="Preview tanda tangan"
          className="block max-w-[90vw] max-h-[85vh] object-contain bg-white"
        />
      </div>
    </div>
  );
};

/* === TABLE CLIENT COMPONENT === */

export default function TableClient({
  dataEkspedisi,
  itemsPerPage,
  selectedYear,
  searchQuery = "",
  userRole,
}: {
  dataEkspedisi: SuratEkspedisi[];
  itemsPerPage: number;
  selectedYear: string;
  searchQuery?: string;
  userRole: "ADMIN" | "STAF";
}) {
  // helper to format dates
  const fmt = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /* 1. FILTER DATA */
  let filteredData = dataEkspedisi || [];

  if (selectedYear) {
    filteredData = filteredData.filter(
      (item) =>
        new Date(item.tglSurat).getFullYear().toString() === selectedYear
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredData = filteredData.filter((item) => {
      return (
        item.noSurat.toLowerCase().includes(q) ||
        item.isiSingkat.toLowerCase().includes(q) ||
        item.ditujukan.toLowerCase().includes(q) ||
        item.keterangan.toLowerCase().includes(q) ||
        fmt(item.tglSurat).toLowerCase().includes(q) ||
        fmt(item.tglPengiriman).toLowerCase().includes(q)
      );
    });
  }

  /* 2. PAGINATION STATE */
  const [currentPage, setCurrentPage] = useState(1);

  // reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, selectedYear, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

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

  /* 3. DELETE STATE / LOGIC */
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

    try {
      const res = await fetch(`/api/surat/${itemToDeleteId}/delete`, {
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
    } catch (err) {
      console.error("fetch DELETE failed:", err);
      setErrorAlertVisible(true);
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDeleteId(null);
    }
  };

  /* 4. IMAGE PREVIEW STATE / LOGIC */
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const openImagePreview = (url: string) => {
    setPreviewImageUrl(url);
    setIsImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setIsImagePreviewOpen(false);
    setPreviewImageUrl(null);
  };

  return (
    <div className="overflow-x-auto p-4 font-sans">
      {/* CONFIRM DELETE MODAL */}
      <Modal
        title="Konfirmasi Hapus"
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
      >
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

      {/* IMAGE PREVIEW MODAL */}
      <ImagePreviewModal
        isOpen={isImagePreviewOpen}
        onClose={closeImagePreview}
        imgUrl={previewImageUrl}
      />

      {/* --- DESKTOP TABLE VIEW (Hidden on Mobile) --- */}
      <div className="hidden md:block">
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
              <th className="px-6 py-3">
                <div className="flex items-center gap-1">Tanda Tangan</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, idx) => (
              <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{startIndex + idx + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <a
                      href={`/buku-ekspedisi/${item.id}`}
                      className="p-2 bg-yellow-400 text-white rounded-md shadow hover:bg-yellow-500 transition-colors"
                    >
                      <Pencil size={16} />
                    </a>
                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => handleOpenConfirmModal(item.id)}
                        className="p-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/api/surat/${item.id}/download`, "_blank")}
                      className="p-2 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700 transition-colors"
                    >
                      <DownloadCloud size={16} />
                    </button>
                    <button
                      onClick={() => window.open(`/api/surat/${item.id}/download-surat`, "_blank")}
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
                <td className="px-6 py-4">
                  {item.signDirectory ? (
                    <button
                      type="button"
                      className="relative group"
                      onClick={() => openImagePreview(item.signDirectory!)}
                    >
                      <img
                        src={item.signDirectory}
                        alt="Tanda tangan"
                        className="h-12 w-12 object-cover rounded ring-1 ring-gray-300 group-hover:ring-blue-500 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 text-white flex items-center justify-center text-[10px] font-medium rounded transition">
                        <ZoomIn size={16} />
                      </div>
                    </button>
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE CARD VIEW (Visible on Mobile) --- */}
      <div className="md:hidden flex flex-col gap-4">
        {paginatedData.map((item, idx) => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  #{startIndex + idx + 1}
                </span>
                <h3 className="font-bold text-gray-800 mt-1">{item.noSurat}</h3>
                <p className="text-xs text-gray-500">{fmt(item.tglSurat)}</p>
              </div>
              <div className="flex gap-1">
                <a
                  href={`/buku-ekspedisi/${item.id}`}
                  className="p-1.5 bg-yellow-400 text-white rounded shadow"
                >
                  <Pencil size={14} />
                </a>
                {userRole === "ADMIN" && (
                  <button
                    onClick={() => handleOpenConfirmModal(item.id)}
                    className="p-1.5 bg-red-600 text-white rounded shadow"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-500">Tujuan:</span>
                <span className="col-span-2">{item.ditujukan}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-500">Perihal:</span>
                <span className="col-span-2">{item.isiSingkat}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-500">Kirim:</span>
                <span className="col-span-2">{fmt(item.tglPengiriman)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-500">Ket:</span>
                <span className="col-span-2">{item.keterangan || "-"}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center border-t pt-3">
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/api/surat/${item.id}/download`, "_blank")}
                  className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded shadow"
                >
                  <DownloadCloud size={12} /> Unduh
                </button>
                <button
                  onClick={() => window.open(`/api/surat/${item.id}/download-surat`, "_blank")}
                  className="flex items-center gap-1 px-2 py-1 bg-teal-500 text-white text-xs rounded shadow"
                >
                  <Download size={12} /> Surat
                </button>
              </div>

              {item.signDirectory && (
                <button
                  type="button"
                  onClick={() => openImagePreview(item.signDirectory!)}
                  className="relative h-10 w-10"
                >
                  <img
                    src={item.signDirectory}
                    alt="TTD"
                    className="h-full w-full object-cover rounded border"
                  />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER / PAGINATION */}
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

      {/* TOASTS */}
      <div className="fixed top-4 right-4 z-[200] w-full max-w-sm">
        <AlertToast
          color="danger"
          title="Gagal menghapus data"
          description="Terjadi kesalahan saat mencoba menghapus data."
          isVisible={errorAlertVisible}
          onClose={() => setErrorAlertVisible(false)}
        />
        <AlertToast
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