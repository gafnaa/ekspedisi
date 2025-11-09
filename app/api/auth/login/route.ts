// Lokasi: app/api/auth/login/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Username dan password diperlukan" },
        { status: 400 }
      );
    }

    // 1. Cari user di database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Username atau password salah" },
        { status: 401 } // Unauthorized
      );
    }

    // 2. Bandingkan password yang diberikan dengan hash di database
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { ok: false, error: "Username atau password salah" },
        { status: 401 } // Unauthorized
      );
    }

    // 3. Jika berhasil, kembalikan data user
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
