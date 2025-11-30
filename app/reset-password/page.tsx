"use client";

import {
    AlertTriangle,
    CheckCircle,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notif, setNotif] = useState<{
    color: "success" | "danger";
    title: string;
    description: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null);

    // Validation
    if (!username || !currentPassword || !newPassword || !confirmPassword) {
      setNotif({
        color: "danger",
        title: "Gagal mengubah password",
        description: "Semua field wajib diisi",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotif({
        color: "danger",
        title: "Gagal mengubah password",
        description: "Password baru dan konfirmasi password tidak cocok",
      });
      return;
    }

    if (newPassword.length < 6) {
      setNotif({
        color: "danger",
        title: "Gagal mengubah password",
        description: "Password minimal 6 karakter",
      });
      return;
    }

    try {
      setIsLoading(true);

      // First, login to verify username and current password
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: currentPassword }),
      });

      const loginJson = await loginRes.json();

      if (!loginJson.ok) {
        setNotif({
          color: "danger",
          title: "Gagal mengubah password",
          description: loginJson.error || "Username atau password salah",
        });
        return;
      }

      // Now change the password
      const resetRes = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: loginJson.data.id,
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      const resetJson = await resetRes.json();

      if (!resetJson.ok) {
        setNotif({
          color: "danger",
          title: "Gagal mengubah password",
          description: resetJson.error || "Server error",
        });
        return;
      }

      setNotif({
        color: "success",
        title: "Password berhasil diubah",
        description: "Silakan login kembali dengan password baru",
      });

      setTimeout(() => {
        router.push("/login");
      }, 2000);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {/* Alert */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm">
          <Alert
            isVisible={!!notif}
            color={notif?.color || "success"}
            title={notif?.title || ""}
            description={notif?.description || ""}
            onClose={() => setNotif(null)}
          />
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Password Lama
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Password Baru
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Konfirmasi Password Baru
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 font-medium text-white bg-orange-600 rounded-lg shadow hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Ubah Password"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
         {" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}
