"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function checkAdmin() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    throw new Error("No autorizado");
  }
}

export async function getProducts(onlyActive = true) {
  return await prisma.product.findMany({
    where: onlyActive ? { active: true } : {},
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(formData: FormData) {
  await checkAdmin();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string);
  const imageFile = formData.get("image") as File;

  let photoUrl = "";

  if (imageFile && imageFile.size > 0) {
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const path = join(process.cwd(), "public", "uploads", "products");
    
    // Asegurar que el directorio existe
    try {
      await mkdir(path, { recursive: true });
    } catch (e) {}

    const filename = `${Date.now()}-${imageFile.name}`;
    const finalPath = join(path, filename);
    await writeFile(finalPath, buffer);
    photoUrl = `/uploads/products/${filename}`;
  }

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      stock,
      image: photoUrl,
    },
  });

  revalidatePath("/shop");
  revalidatePath("/dashboard/admin/products");
  return product;
}

export async function updateProduct(id: string, formData: FormData) {
  await checkAdmin();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string);
  const imageFile = formData.get("image") as File;
  const removeImage = formData.get("removeImage") === "true";

  const currentProduct = await prisma.product.findUnique({ where: { id } });
  let photoUrl = currentProduct?.image || "";

  if (removeImage) {
    photoUrl = "";
  }

  if (imageFile && imageFile.size > 0) {
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const path = join(process.cwd(), "public", "uploads", "products");
    try {
      await mkdir(path, { recursive: true });
    } catch (e) {}

    const filename = `${Date.now()}-${imageFile.name}`;
    const finalPath = join(path, filename);
    await writeFile(finalPath, buffer);
    photoUrl = `/uploads/products/${filename}`;
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price,
      stock,
      image: photoUrl,
    },
  });

  revalidatePath("/shop");
  revalidatePath("/dashboard/admin/products");
  return product;
}

export async function toggleProductStatus(id: string) {
  await checkAdmin();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("Producto no encontrado");

  const updated = await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  });

  revalidatePath("/shop");
  revalidatePath("/dashboard/admin/products");
  return updated;
}

export async function deleteProduct(id: string) {
  await checkAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/shop");
  revalidatePath("/dashboard/admin/products");
}
