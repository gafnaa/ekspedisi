import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Peringatan: Password tidak di-hash! Ini tidak aman untuk produksi.
    // Ini hanya meniru logika login Anda saat ini.
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Validasi password (sesuai logika lama Anda)
    const isValidPassword =
      (user.username === "admin" && password === "admin123") ||
      (user.username === "user" && password === "user123") ||
      (user.username === 'staf1' && password === 'user123'); // Menambahkan staf1 dari seed

    if (!isValidPassword) {
      return NextResponse.json(
        { ok: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Jika berhasil, kembalikan data user (terutama id dan role)
    return NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        role: user.role,
        namaLengkap: user.namaLengkap,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}