import nodemailer from "nodemailer";

// Configuración del transporter usando variables de entorno
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true para 465, false para otros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendLocationEmail = async (
  ownerEmail: string,
  petName: string,
  latitude: number,
  longitude: number
) => {
  const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

  try {
    const info = await transporter.sendMail({
      from: `"No Me Pierdo" <${process.env.SMTP_USER || "noreply@nomepierdo.com"}>`,
      to: ownerEmail,
      subject: `📍 ¡Alguien escaneó a ${petName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #16a34a; margin-bottom: 20px;">¡Notificación de Escaneo!</h2>
          <p style="font-size: 16px; color: #374151;">
            Hola, te avisamos que alguien acaba de escanear la chapita de <strong>${petName}</strong> y nos compartió su ubicación actual de forma segura.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${mapUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Ver Ubicación Exacta en el Mapa
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Coordenadas GPS: ${latitude}, ${longitude}<br><br>
            <em>* Si el mensaje por WhatsApp no te llegó, asegurate de contactar al número impreso en la chapita o dirigirte a la ubicación con precaución.</em>
          </p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando email de ubicación:", error);
    return { success: false, error };
  }
};
