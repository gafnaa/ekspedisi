import React from "react";

export default function TableSkeleton() {
  return (
    <div className="overflow-x-auto p-4 font-sans animate-pulse">
      {/* Search Bar Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="w-full md:w-1/3 h-10 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              {[...Array(9)].map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b">
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </td>
                {[...Array(7)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
