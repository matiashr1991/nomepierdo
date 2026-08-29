"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";

export async function createOrder(petId: string, productName: string, productPrice: number, productId?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Al crear la orden NO descontamos stock, solo registramos la intención
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
  revalidatePath("/dashboard");
  return order;
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Obtenemos la orden actual para saber si tiene producto vinculado
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) throw new Error("Orden no encontrada");

  // SI el nuevo estado es COMPLETED y antes no lo estaba, descontamos stock
  if (newStatus === "COMPLETED" && order.status !== "COMPLETED" && order.productId) {
    const product = await prisma.product.findUnique({
      where: { id: order.productId }
    });

    if (product) {
      if (product.stock > 0) {
        await prisma.product.update({
          where: { id: order.productId },
          data: { stock: { decrement: 1 } }
        });
      } else {
        throw new Error("No hay stock suficiente para completar esta orden.");
      }
    }
  }

  // SI se cancela una orden que ya estaba COMPLETADA, devolvemos el stock
  if (newStatus === "CANCELLED" && order.status === "COMPLETED" && order.productId) {
    await prisma.product.update({
      where: { id: order.productId },
      data: { stock: { increment: 1 } }
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus }
  });

  revalidatePath("/dashboard/admin/orders");
  revalidatePath("/shop");
  return updatedOrder;
}
