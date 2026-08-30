"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

function generatePublicCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createPet(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const whatsappPhone = formData.get("whatsappPhone") as string;
  const publicMessage = formData.get("publicMessage") as string;
  const photo = formData.get("photo") as File;

  let photoUrl = null;

  if (photo && photo.size > 0) {
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const extension = path.extname(photo.name);
    const filename = `pet-${uniqueSuffix}${extension}`;
    
    const filepath = path.join(process.cwd(), "public/uploads", filename);
    await mkdir(path.dirname(filepath), { recursive: true });
    await writeFile(filepath, buffer);
    
    photoUrl = `/api/uploads/${filename}`;
  }

  // Generate unique public code
  let publicCode = generatePublicCode();
  // Ensure it's unique
  let codeExists = await prisma.pet.findUnique({ where: { publicCode } });
  while (codeExists) {
    publicCode = generatePublicCode();
    codeExists = await prisma.pet.findUnique({ where: { publicCode } });
  }

  const pet = await prisma.pet.create({
    data: {
      userId: session.user.id,
      name,
      type,
      whatsappPhone,
      publicMessage,
      publicCode,
      photoUrl,
    }
  });

  revalidatePath("/dashboard/pets");
  redirect("/dashboard/pets");
}

export async function updatePet(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet || pet.userId !== session.user.id) {
    throw new Error("Unauthorized or not found");
  }

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const whatsappPhone = formData.get("whatsappPhone") as string;
  const publicMessage = formData.get("publicMessage") as string;
  const status = formData.get("status") as string;
  const photo = formData.get("photo") as File;

  let photoUrl = pet.photoUrl;

  if (photo && photo.size > 0) {
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const extension = path.extname(photo.name);
    const filename = `pet-${uniqueSuffix}${extension}`;
    
    const filepath = path.join(process.cwd(), "public/uploads", filename);
    await mkdir(path.dirname(filepath), { recursive: true });
    await writeFile(filepath, buffer);
    
    photoUrl = `/api/uploads/${filename}`;
  }

  await prisma.pet.update({
    where: { id },
    data: {
      name,
      type,
      whatsappPhone,
      publicMessage,
      status,
      photoUrl,
    }
  });

  revalidatePath("/dashboard/pets");
  revalidatePath(`/dashboard/pets/${id}/edit`);
  redirect("/dashboard/pets");
}
