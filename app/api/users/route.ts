// app/api/users/route.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch users
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userRole = searchParams.get("role");

    // Only ADMIN can fetch users
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      data: users,
    });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new user
export async function POST(req: Request) {
  try {
    const { username, namaLengkap, role, password, adminRole } =
      await req.json();

    // Validation
    if (!username || !namaLengkap || !role || !password) {
      return NextResponse.json(
        { ok: false, error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    if (adminRole !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Hanya ADMIN yang bisa membuat user" },
        { status: 401 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "Username sudah digunakan" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        namaLengkap,
        role,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST users error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update user
export async function PUT(req: Request) {
  try {
    const { id, username, namaLengkap, role, password, adminRole } =
      await req.json();

    // Validation
    if (!id || !namaLengkap || !role) {
      return NextResponse.json(
        { ok: false, error: "ID, nama lengkap, dan role wajib diisi" },
        { status: 400 }
      );
    }

    if (adminRole !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Hanya ADMIN yang bisa mengubah user" },
        { status: 401 }
      );
    }

    // Build update data
    const updateData: any = {
      namaLengkap,
      role,
    };

    if (password && password.trim()) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: user,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "User tidak ditemukan" },
        { status: 404 }
      );
    }
    console.error("PUT users error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete user
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    const userRole = searchParams.get("role");

    // Validation
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID user wajib diisi" },
        { status: 400 }
      );
    }

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Hanya ADMIN yang bisa menghapus user" },
        { status: 401 }
      );
    }

    // Delete user
    const user = await prisma.user.delete({
      where: { id },
      select: {
        id: true,
        username: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: user,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "User tidak ditemukan" },
        { status: 404 }
      );
    }
    console.error("DELETE users error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Change password
export async function PATCH(req: Request) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();

    // Validation
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, error: "User ID, password lama, dan password baru wajib diisi" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { ok: false, error: "Password lama tidak cocok" },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      ok: true,
      data: { message: "Password berhasil diubah" },
    });
  } catch (error) {
    console.error("PATCH users error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
