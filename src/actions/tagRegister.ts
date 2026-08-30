"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface RegisterPetFromTagInput {
  tagCode: string;
  // Pet fields
  petName: string;
  petType: string;
  whatsappPhone: string;
  publicMessage?: string;
  breed?: string;
  color?: string;
  sex?: string;
  photoUrl?: string;
  // User fields (for updating profile)
  province?: string;
  city?: string;
  phone?: string;
}

export async function registerPetFromTag(input: RegisterPetFromTagInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Debés iniciar sesión para registrar tu mascota.");
  }

  // Validate the tag
  const tag = await prisma.qrTag.findUnique({
    where: { code: input.tagCode },
  });

  if (!tag) {
    throw new Error("El código de tag no existe.");
  }

  if (tag.status !== "UNREGISTERED") {
    throw new Error("Este collar ya fue registrado o está bloqueado.");
  }

  // Generate a unique public code for the pet (same as legacy flow)
  let publicCode: string;
  let attempts = 0;
  do {
    publicCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const exists = await prisma.pet.findUnique({ where: { publicCode } });
    if (!exists) break;
    attempts++;
  } while (attempts < 50);

  if (attempts >= 50) {
    throw new Error("Error generando código público. Intente nuevamente.");
  }

  // Transaction: create pet + update tag + update user
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the pet
    const pet = await tx.pet.create({
      data: {
        name: input.petName,
        type: input.petType,
        whatsappPhone: input.whatsappPhone,
        publicMessage: input.publicMessage || null,
        breed: input.breed || null,
        color: input.color || null,
        sex: input.sex || null,
        photoUrl: input.photoUrl || null,
        publicCode,
        userId: session.user!.id as string,
      },
    });

    // 2. Activate the tag
    await tx.qrTag.update({
      where: { id: tag.id },
      data: {
        status: "ACTIVE",
        petId: pet.id,
        activatedById: session.user!.id as string,
        activatedAt: new Date(),
      },
    });

    // 3. Update user profile if location data provided
    const userUpdates: Prisma.UserUpdateInput = {};
    if (input.province) userUpdates.province = input.province;
    if (input.city) userUpdates.city = input.city;
    if (input.phone) userUpdates.phone = input.phone;

    if (Object.keys(userUpdates).length > 0) {
      await tx.user.update({
        where: { id: session.user!.id as string },
        data: userUpdates,
      });
    }

    // 4. Generate QR code for the pet (legacy compatibility)
    await tx.qrCode.create({
      data: {
        petId: pet.id,
        targetUrl: `/p/${publicCode}`,
      },
    });

    return pet;
  });

  revalidatePath("/dashboard/pets");
  return { petId: result.id, publicCode: result.publicCode };
}
