// app/buku-ekspedisi/page.tsx
"use client"; // Add use client directive

import TableClient from "@/app/buku-ekspedisi/table-client";
import { Download, Plus, Printer, Search } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react"; // Import useState and useEffect

export const dynamic = "force-dynamic"; // or use revalidate if you prefer ISR

async function getData() {
  const res = await fetch("http://localhost:3000/api/surat", {
    cache: "no-store",
  });

  const json = await res.json();
  return json.data;
}

export default function BukuEkspedisiPage() {
  // Change to client component
  const [dataEkspedisi, setDataEkspedisi] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10); // State for items per page
  const [selectedYear, setSelectedYear] = useState(""); // State for selected year

  useEffect(() => {
    async function fetchData() {
      const data = await getData();
      setDataEkspedisi(data);
    }
    fetchData();
  }, []);

  // Extract distinct years from dataEkspedisi
  const distinctYears = Array.from(
    new Set(
      dataEkspedisi
        .map((item: any) => new Date(item.tglSurat).getFullYear())
        .filter((year) => !isNaN(year)) // Filter out invalid years
    )
  ).sort((a, b) => b - a); // Sort in descending order

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">
        Buku Ekspedisi
      </h1>

      {/* Area Tombol Aksi Atas */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
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
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              onChange={handleYearChange}
              value={selectedYear}
            >
              <option value="">Tahun</option>
              {distinctYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              onChange={handleItemsPerPageChange}
              value={itemsPerPage}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-black">entri</span>
          </div>

          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="kata kunci pencarian"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        {/* Tabel Data (Client Component for interactivity like Delete) */}
        <TableClient
          key={`${itemsPerPage}-${selectedYear}`}
          dataEkspedisi={dataEkspedisi}
          itemsPerPage={itemsPerPage}
          selectedYear={selectedYear}
        />
      </div>
    </div>
  );
}
