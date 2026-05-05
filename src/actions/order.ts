"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOrder(petId: string, productName: string, productPrice: number, productId?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      petId: petId,
      productId: productId,
      productName: productName,
      productPrice: productPrice,
      status: "PENDING",
    },
  });

  revalidatePath("/shop");
  return order;
}
