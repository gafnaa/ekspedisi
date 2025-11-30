// app/management-account/page.tsx
"use client";

import {
  AlertTriangle,
  CheckCircle,
  Edit,
  LogOut,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  namaLengkap: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAF";
  createdAt: string;
}

interface FormData {
  username: string;
  namaLengkap: string;
  role: "ADMIN" | "STAF";
  password: string;
}

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

export default function ManagementAccountPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    namaLengkap: "",
    role: "STAF",
    password: "",
  });
  const [notif, setNotif] = useState<{
    color: "success" | "danger";
    title: string;
    description: string;
  } | null>(null);

  // Check user role on mount
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "ADMIN") {
      router.push("/buku-ekspedisi");
      return;
    }
    setUserRole(role);
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/users?role=${localStorage.getItem("userRole")}`
      );
      const json = await res.json();

      if (json.ok) {
        setUsers(json.data);
      } else {
        setNotif({
          color: "danger",
          title: "Gagal memuat data",
          description: json.error || "Terjadi kesalahan",
        });
      }
    } catch (error) {
      setNotif({
        color: "danger",
        title: "Error",
        description: "Gagal terhubung ke server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        username: user.username,
        namaLengkap: user.namaLengkap,
        role: user.role as "ADMIN" | "STAF",
        password: "",
      });
    } else {
      setEditingUserId(null);
      setFormData({
        username: "",
        namaLengkap: "",
        role: "STAF",
        password: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUserId(null);
    setFormData({
      username: "",
      namaLengkap: "",
      role: "STAF",
      password: "",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null);

    // Validation
    if (!formData.username || !formData.namaLengkap || !formData.role) {
      setNotif({
        color: "danger",
        title: "Gagal menyimpan",
        description: "Semua field wajib diisi",
      });
      return;
    }

    if (!editingUserId && !formData.password) {
      setNotif({
        color: "danger",
        title: "Gagal menyimpan",
        description: "Password wajib diisi untuk user baru",
      });
      return;
    }

    try {
      const method = editingUserId ? "PUT" : "POST";
      const payload = {
        ...formData,
        id: editingUserId,
        adminRole: localStorage.getItem("userRole"),
      };

      const res = await fetch("/api/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.ok) {
        setNotif({
          color: "danger",
          title: "Gagal menyimpan",
          description: json.error || "Server error",
        });
        return;
      }

      setNotif({
        color: "success",
        title: editingUserId ? "User berhasil diperbarui" : "User berhasil dibuat",
        description: "Data user telah disimpan",
      });

      setTimeout(() => {
        handleCloseModal();
        fetchUsers();
      }, 1500);
    } catch (error) {
      setNotif({
        color: "danger",
        title: "Error",
        description: "Gagal terhubung ke server",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;

    try {
      const res = await fetch(
        `/api/users?id=${id}&role=${localStorage.getItem("userRole")}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!json.ok) {
        setNotif({
          color: "danger",
          title: "Gagal menghapus",
          description: json.error || "Server error",
        });
        return;
      }

      setNotif({
        color: "success",
        title: "User berhasil dihapus",
        description: "Data user telah dihapus dari sistem",
      });

      setTimeout(() => {
        fetchUsers();
      }, 1500);
    } catch (error) {
      setNotif({
        color: "danger",
        title: "Error",
        description: "Gagal terhubung ke server",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userNama");
    router.push("/login");
  };

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      {/* Alert */}
      <div className="fixed top-4 sm:top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 sm:w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <Alert
          isVisible={!!notif}
          color={notif?.color || "success"}
          title={notif?.title || ""}
          description={notif?.description || ""}
          onClose={() => setNotif(null)}
        />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Management Account</h1>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Tombol Tambah */}
      <div className="mb-4">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      {/* Tabel Users */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada user</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Nama Lengkap
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Dibuat
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-3 text-sm text-gray-800">
                      {user.username}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-800">
                      {user.namaLengkap}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === "SUPER_ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "ADMIN"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        {user.role !== "SUPER_ADMIN" && (
                          <>
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingUserId ? "Edit User" : "Tambah User Baru"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!!editingUserId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="STAF">STAF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUserId && "(Kosongkan jika tidak ingin ubah)"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
