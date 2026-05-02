import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLocationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { publicCode, latitude, longitude } = await request.json();

    if (!publicCode || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Buscamos a la mascota y el mail de su dueño (el usuario que la creó)
    const pet = await prisma.pet.findUnique({
      where: { publicCode },
      include: { user: true }
    });

    if (!pet || !pet.user?.email) {
      return NextResponse.json({ error: "Pet or owner email not found" }, { status: 404 });
    }

    // Si las variables de entorno no están configuradas, evitamos intentar enviar
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("Variables SMTP no configuradas. Simulando envío exitoso.");
      return NextResponse.json({ success: true, message: "Simulated sending (No SMTP set)" });
    }

    // Enviamos el correo
    const result = await sendLocationEmail(pet.user.email, pet.name, latitude, longitude);

    if (result.success) {
      return NextResponse.json({ success: true, message: "Email notification sent" });
    } else {
      console.error("Fallo al enviar correo:", result.error);
      // Retornamos 200 igual para no romper la experiencia en el frontend (botón WhatsApp)
      return NextResponse.json({ success: false, message: "Email failed but process continued" });
    }

  } catch (error) {
    console.error("API /api/notify-location error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
