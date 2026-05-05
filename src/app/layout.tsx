import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "No Me Pierdo | Perfil Digital QR para Mascotas",
  description: "Protegé a tu perro o gato con un código QR único. Si se pierde, quien lo encuentre podrá contactarte por WhatsApp y compartir su ubicación al instante.",
  keywords: ["identificación mascotas", "QR para perros", "QR para gatos", "mascotas perdidas", "Posadas Misiones", "No Me Pierdo", "chapa identificación digital"],
  authors: [{ name: "No Me Pierdo Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nomepierdo.mmatdev.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "No Me Pierdo | Identidad Digital QR para Mascotas",
    description: "La forma más rápida y segura de que tu mascota vuelva a casa. Generá su QR gratis.",
    url: "/",
    siteName: "No Me Pierdo",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/og-image.png", // Asumiendo que crearás una imagen de preview
        width: 1200,
        height: 630,
        alt: "No Me Pierdo - Identificación QR",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "No Me Pierdo | Identidad Digital QR para Mascotas",
    description: "Protegé a tu mascota con un código QR único. Contacto por WhatsApp al instante.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
