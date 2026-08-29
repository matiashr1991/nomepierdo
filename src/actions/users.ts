"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return { ...session, user: { ...session.user, id: session.user.id as string } };
}

/**
 * Create a new admin user with email + password
 */
export async function createAdminUser(formData: FormData) {
  const session = await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    throw new Error("Nombre, email y contraseña son obligatorios.");
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Ya existe un usuario con ese email.");
  }

  const password_hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password_hash,
      role: "admin",
    },
  });

  revalidatePath("/dashboard/admin/users");
}

/**
 * Promote an existing user to admin
 */
export async function promoteToAdmin(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado.");
  if (user.role === "admin") throw new Error("El usuario ya es administrador.");

  await prisma.user.update({
    where: { id: userId },
    data: { role: "admin" },
  });

  revalidatePath("/dashboard/admin/users");
}

/**
 * Demote an admin to regular user
 */
export async function demoteFromAdmin(userId: string) {
  const session = await requireAdmin();

  // Can't demote yourself
  if (userId === session.user.id) {
    throw new Error("No podés quitarte el rol de admin a vos mismo.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado.");
  if (user.role !== "admin") throw new Error("El usuario no es administrador.");

  await prisma.user.update({
    where: { id: userId },
    data: { role: "user" },
  });

  revalidatePath("/dashboard/admin/users");
}
