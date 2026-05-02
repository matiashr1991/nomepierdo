"use client";

import { useState } from "react";
import { MapPin, Loader2, MessageCircle } from "lucide-react";

interface LocationButtonProps {
  publicCode: string;
  whatsappPhone: string;
  petName: string;
  isLost: boolean;
}

export function LocationButton({ publicCode, whatsappPhone, petName, isLost }: LocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleContactClick = () => {
    setIsLoading(true);

    const baseText = isLost 
      ? `Hola, encontré a ${petName}. ¡Está conmigo!` 
      : `Hola, estoy viendo la chapita de ${petName}.`;

    if (!navigator.geolocation) {
      // Geolocation not supported, fallback to normal message
      sendWhatsApp(baseText);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Success
        const { latitude, longitude } = position.coords;
        const locationText = `\n\n📍 Mi ubicación exacta es: https://maps.google.com/?q=${latitude},${longitude}`;
        
        // Notify backend invisibly for Email alert
        try {
          await fetch('/api/notify-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicCode, latitude, longitude })
          });
        } catch (e) {
          console.error("Failed to notify backend", e);
        }

        sendWhatsApp(baseText + locationText);
      },
      (error) => {
        // User denied or error, fallback to normal message
        console.warn("Geolocation error or denied:", error);
        sendWhatsApp(baseText);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const sendWhatsApp = (text: string) => {
    setIsLoading(false);
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <button 
      onClick={handleContactClick}
      disabled={isLoading}
      className={`w-full flex items-center justify-center px-8 py-5 border border-transparent text-lg font-bold rounded-2xl text-white shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${
        isLost 
          ? "bg-red-600 hover:bg-red-700 shadow-red-200" 
          : "bg-[#25D366] hover:bg-[#20bd5a] shadow-green-200"
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-7 h-7 mr-3 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-7 h-7 mr-3 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      )}
      {isLoading ? "Obteniendo ubicación..." : "Enviar WhatsApp"}
    </button>
  );
}
