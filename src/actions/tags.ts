"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// =============================================================================
// HELPERS
// =============================================================================

function generateTagCode(prefix: string, length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing characters
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return { ...session, user: { ...session.user, id: session.user.id as string } };
}

// =============================================================================
// TAG BATCH ACTIONS
// =============================================================================

export async function createBatch(formData: FormData) {
  const session = await requireAdmin();

  const name = formData.get("name") as string;
  const prefix = (formData.get("prefix") as string) || "NMP";
  const quantity = parseInt(formData.get("quantity") as string, 10);

  if (!name || !quantity || quantity < 1 || quantity > 500) {
    throw new Error("Datos inválidos. La cantidad debe ser entre 1 y 500.");
  }

  // Generate unique codes for all tags
  const existingCodes = new Set(
    (await prisma.qrTag.findMany({ select: { code: true } })).map((t) => t.code)
  );

  const newCodes: string[] = [];
  let attempts = 0;
  const maxAttempts = quantity * 10;

  while (newCodes.length < quantity && attempts < maxAttempts) {
    const code = generateTagCode(prefix);
    if (!existingCodes.has(code) && !newCodes.includes(code)) {
      newCodes.push(code);
    }
    attempts++;
  }

  if (newCodes.length < quantity) {
    throw new Error("No se pudieron generar suficientes códigos únicos. Intente con otro prefijo.");
  }

  // Create batch + tags in a transaction
  await prisma.$transaction(async (tx) => {
    const batch = await tx.tagBatch.create({
      data: {
        name,
        prefix,
        quantity,
        createdById: session.user!.id,
      },
    });

    await tx.qrTag.createMany({
      data: newCodes.map((code) => ({
        code,
        batchId: batch.id,
      })),
    });
  });

  revalidatePath("/dashboard/admin/tags");
}

export async function getBatches() {
  await requireAdmin();

  return prisma.tagBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true, email: true } },
      _count: { select: { tags: true } },
      tags: {
        select: { status: true },
      },
    },
  });
}

// =============================================================================
// TAG ACTIONS
// =============================================================================

export async function getTags(filters?: {
  status?: string;
  batchId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAdmin();

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters?.batchId && filters.batchId !== "ALL") {
    where.batchId = filters.batchId;
  }

  if (filters?.search) {
    where.OR = [
      { code: { contains: filters.search, mode: "insensitive" } },
      { pet: { name: { contains: filters.search, mode: "insensitive" } } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [tags, total] = await Promise.all([
    prisma.qrTag.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        batch: { select: { name: true, prefix: true } },
        pet: {
          select: {
            id: true,
            name: true,
            type: true,
            photoUrl: true,
            status: true,
            user: { select: { name: true, email: true, phone: true } },
          },
        },
        _count: { select: { scans: true } },
      },
    }),
    prisma.qrTag.count({ where }),
  ]);

  return { tags, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getTagByCode(code: string) {
  return prisma.qrTag.findUnique({
    where: { code },
    include: {
      batch: true,
      pet: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      scans: {
        orderBy: { scannedAt: "desc" },
        take: 10,
      },
    },
  });
}

/**
 * Reset ("blanquear") a tag — unlinks the pet and sets status back to UNREGISTERED
 */
export async function resetTag(tagId: string) {
  await requireAdmin();

  const tag = await prisma.qrTag.findUnique({ where: { id: tagId } });
  if (!tag) throw new Error("Tag no encontrado");
  if (tag.status === "UNREGISTERED") throw new Error("El tag ya está sin registrar");

  await prisma.qrTag.update({
    where: { id: tagId },
    data: {
      petId: null,
      activatedById: null,
      activatedAt: null,
      status: "UNREGISTERED",
      notes: `${tag.notes ? tag.notes + " | " : ""}Blanqueado el ${new Date().toLocaleDateString("es-AR")}`,
    },
  });

  revalidatePath("/dashboard/admin/tags");
}

/**
 * Block a tag — prevents registration and hides info
 */
export async function blockTag(tagId: string) {
  await requireAdmin();

  await prisma.qrTag.update({
    where: { id: tagId },
    data: { status: "BLOCKED" },
  });

  revalidatePath("/dashboard/admin/tags");
}

/**
 * Unblock a tag — sets back to UNREGISTERED (unlinks pet too)
 */
export async function unblockTag(tagId: string) {
  await requireAdmin();

  await prisma.qrTag.update({
    where: { id: tagId },
    data: {
      status: "UNREGISTERED",
      petId: null,
      activatedById: null,
      activatedAt: null,
    },
  });

  revalidatePath("/dashboard/admin/tags");
}

/**
 * Update admin notes on a tag
 */
export async function updateTagNotes(tagId: string, notes: string) {
  await requireAdmin();

  await prisma.qrTag.update({
    where: { id: tagId },
    data: { notes },
  });

  revalidatePath("/dashboard/admin/tags");
}

/**
 * Get stats summary for the admin dashboard
 */
export async function getTagStats() {
  await requireAdmin();

  const [total, unregistered, active, lost, blocked, totalBatches] = await Promise.all([
    prisma.qrTag.count(),
    prisma.qrTag.count({ where: { status: "UNREGISTERED" } }),
    prisma.qrTag.count({ where: { status: "ACTIVE" } }),
    prisma.qrTag.count({ where: { status: "LOST" } }),
    prisma.qrTag.count({ where: { status: "BLOCKED" } }),
    prisma.tagBatch.count(),
  ]);

  return { total, unregistered, active, lost, blocked, totalBatches };
}
