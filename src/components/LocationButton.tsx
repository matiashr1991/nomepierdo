"use client";

import { useState, useRef } from "react";
import { Loader2, Send, MapPin, AlertTriangle } from "lucide-react";

interface LocationButtonProps {
  publicCode: string;
  whatsappPhone: string;
  petName: string;
  isLost: boolean;
}

type ButtonStatus = "idle" | "searching" | "ready" | "error";

export function LocationButton({ publicCode, whatsappPhone, petName, isLost }: LocationButtonProps) {
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const clickTimeRef = useRef<number>(0);

  const baseText = isLost 
    ? `Hola, encontré a ${petName}. ¡Está conmigo!` 
    : `Hola, estoy viendo la chapita de ${petName}.`;

  const getWhatsAppUrl = (text: string) => {
    return `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(text)}`;
  };

  const handleInitialClick = () => {
    setStatus("searching");
    clickTimeRef.current = Date.now();

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationText = `\n\n📍 Mi ubicación exacta es: https://maps.google.com/?q=${latitude},${longitude}`;
        const finalUrl = getWhatsAppUrl(baseText + locationText);
        
        setWhatsappUrl(finalUrl);

        // Notificar al dueño por Email inmediatamente (por detrás)
        fetch('/api/notify-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicCode, latitude, longitude })
        }).catch(e => console.error("Failed to notify backend", e));

        const timeElapsed = Date.now() - clickTimeRef.current;
        
        // Si fue rápido (< 1.5s), intentamos redirigir automáticamente
        if (timeElapsed < 1500) {
          window.location.href = finalUrl;
          // Dejamos en 'ready' por si el navegador bloqueó el redirect igual
          setStatus("ready");
        } else {
          // Si tardó mucho, Safari/Brave bloquearán el redirect automático.
          // Pasamos a 'ready' para que el usuario haga el segundo clic.
          setStatus("ready");
        }
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  };

  const handleWhatsAppClick = () => {
    if (whatsappUrl) {
      window.location.href = whatsappUrl;
    }
  };

  if (status === "idle") {
    return (
      <button 
        onClick={handleInitialClick}
        className={`w-full flex items-center justify-center px-8 py-5 border border-transparent text-lg font-bold rounded-2xl text-white shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 ${
          isLost ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-[#25D366] hover:bg-[#20bd5a] shadow-green-200"
        }`}
      >
        <MapPin className="w-6 h-6 mr-3" />
        Compartir Ubicación y Contactar
      </button>
    );
  }

  if (status === "searching") {
    return (
      <div className="w-full bg-white border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center animate-pulse">
        <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" />
        <p className="text-blue-700 font-bold">Obteniendo ubicación precisa...</p>
        <p className="text-blue-500 text-sm mt-1">Esto nos permite avisar al dueño dónde estás.</p>
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className="space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <p className="text-green-800 font-medium text-sm">✅ Ubicación capturada con éxito</p>
        </div>
        <button 
          onClick={handleWhatsAppClick}
          className="w-full flex items-center justify-center px-8 py-6 bg-[#25D366] hover:bg-[#20bd5a] text-xl font-black rounded-2xl text-white shadow-2xl transition-all transform hover:scale-[1.05] active:scale-95 animate-bounce-subtle"
        >
          <Send className="w-7 h-7 mr-3" />
          ENVIAR WHATSAPP AHORA
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-amber-800 font-bold">No pudimos obtener tu ubicación</p>
          <p className="text-amber-600 text-sm">Por favor, asegúrate de dar permiso de GPS si el navegador te lo pide.</p>
        </div>
        <button 
          onClick={() => {
            setWhatsappUrl(getWhatsAppUrl(baseText));
            setStatus("ready");
          }}
          className="w-full py-4 text-gray-500 font-bold hover:text-gray-700"
        >
          Contactar sin ubicación
        </button>
      </div>
    );
  }

  return null;
}
