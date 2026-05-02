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
  title: "Perfil Digital QR para mascotas | Contacto por WhatsApp si se pierde",
  description: "Generá un perfil online y un código QR único para tu perro o gato. Si alguien lo encuentra, puede contactarte por WhatsApp al instante.",
  openGraph: {
    title: "Perfil Digital QR para mascotas | No Me Pierdo",
    description: "Generá un perfil online y un código QR único para tu perro o gato.",
    url: "https://nomepierdo.com",
    siteName: "No Me Pierdo",
    locale: "es_AR",
    type: "website",
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
