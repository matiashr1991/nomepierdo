"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import {
  LogIn, Dog, ArrowRight, ArrowLeft, Check, Loader2,
  PawPrint, Phone, MapPin, Shield, ChevronDown, Camera, PartyPopper
} from "lucide-react";
import { signIn } from "next-auth/react";
import { registerPetFromTag } from "@/actions/tagRegister";
import Link from "next/link";

interface TagRegisterFlowProps {
  tagCode: string;
  tagId: string;
  isLoggedIn: boolean;
  userName?: string;
  userEmail?: string;
  userId?: string;
}

const PROVINCES = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
];

const PET_TYPES = [
  { value: "perro", label: "🐶 Perro" },
  { value: "gato", label: "🐱 Gato" },
  { value: "otro", label: "🐾 Otro" },
];

export default function TagRegisterFlow({
  tagCode, tagId, isLoggedIn, userName, userEmail, userId,
}: TagRegisterFlowProps) {
  const [step, setStep] = useState(isLoggedIn ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ publicCode: string } | null>(null);

  // Form state
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("perro");
  const [whatsapp, setWhatsapp] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [sex, setSex] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    // Store tagCode for after redirect
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pendingTagCode", tagCode);
    }
    await signIn("google", { callbackUrl: `/t/${tagCode}` });
  };

  const handleSubmit = async () => {
    setError(null);

    if (!petName.trim()) {
      setError("Ingresá el nombre de tu mascota.");
      return;
    }
    if (!whatsapp.trim()) {
      setError("Ingresá un teléfono de contacto.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerPetFromTag({
        tagCode,
        petName: petName.trim(),
        petType,
        whatsappPhone: whatsapp.trim(),
        publicMessage: publicMessage.trim() || undefined,
        breed: breed.trim() || undefined,
        color: color.trim() || undefined,
        sex: sex || undefined,
        province: province || undefined,
        city: city.trim() || undefined,
        phone: whatsapp.trim() || undefined,
      });
      setSuccess({ publicCode: result.publicCode });
    } catch (err: any) {
      setError(err.message || "Error al registrar. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== SUCCESS SCREEN ====================
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">¡Collar Activado!</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            <strong>{petName}</strong> ya tiene su collar QR activo. Cualquiera que lo escanee podrá contactarte.
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Código del Collar</p>
            <code className="text-2xl font-mono font-black text-gray-900 tracking-widest">{tagCode}</code>
          </div>

          <div className="space-y-3">
            <Link
              href="/dashboard/pets"
              className="block w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-center transition-colors shadow-lg"
            >
              Ir a Mi Panel
            </Link>
            <Link
              href={`/p/${success.publicCode}`}
              className="block w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-center transition-colors"
            >
              Ver Perfil Público de {petName}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==================== WIZARD ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Brand */}
        <div className="flex justify-center mb-6">
          <Logo
            href={null}
            textClassName="text-2xl bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent"
            iconClassName="h-8 w-8 text-green-600"
          />
        </div>

        {/* Tag Badge */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-bold">
            <Shield className="w-4 h-4" />
            Collar: <code className="font-mono tracking-wider">{tagCode}</code>
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 1 ? "bg-green-600 text-white" : "bg-green-100 text-green-600"
          }`}>
            {step > 1 ? <Check className="w-4 h-4" /> : <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">1</span>}
            <span>Crear Cuenta</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-200" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 2 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"
          }`}>
            <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">2</span>
            <span>Tu Mascota</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* ==================== STEP 1: AUTH ==================== */}
          {step === 1 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">¡Activá tu collar!</h2>
                <p className="text-gray-500">Creá tu cuenta o ingresá para registrar a tu mascota en este collar QR.</p>
              </div>

              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 mb-4 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400 font-medium">o</span>
                </div>
              </div>

              {/* Email/Password Login */}
              <Link
                href={`/login?callbackUrl=/t/${tagCode}`}
                className="w-full block text-center px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold transition-colors"
              >
                Ingresá con Email y Contraseña
              </Link>

              <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
                Al continuar, aceptás los términos del servicio de No Me Pierdo.
                Tu información se usa únicamente para facilitar el contacto si encontramos a tu mascota.
              </p>
            </div>
          )}

          {/* ==================== STEP 2: PET DATA ==================== */}
          {step === 2 && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PawPrint className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Datos de tu Mascota</h2>
                {userName && (
                  <p className="text-gray-500 text-sm">
                    Hola <strong>{userName}</strong>, completá los datos de tu mascota.
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Pet Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Nombre de la Mascota *
                  </label>
                  <input
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-lg font-medium"
                    placeholder="Ej: Firulais, Luna, Max..."
                  />
                </div>

                {/* Pet Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipo *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {PET_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setPetType(t.value)}
                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                          petType === t.value
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />
                    WhatsApp de Contacto *
                  </label>
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50"
                    placeholder="Ej: 5493764123456"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Con código de país. Ej: 549 + código de área + número
                  </p>
                </div>

                {/* Optional: breed, color, sex */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
                    Datos opcionales (ayudan a identificar)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Raza</label>
                      <input
                        value={breed}
                        onChange={(e) => setBreed(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-sm"
                        placeholder="Labrador"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Color</label>
                      <input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-sm"
                        placeholder="Dorado"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Sexo</label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-sm"
                      >
                        <option value="">—</option>
                        <option value="macho">Macho</option>
                        <option value="hembra">Hembra</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Public message */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Mensaje público (opcional)
                  </label>
                  <textarea
                    value={publicMessage}
                    onChange={(e) => setPublicMessage(e.target.value)}
                    rows={2}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-sm resize-none"
                    placeholder="Ej: Tiene tratamiento médico, toma medicación..."
                  />
                </div>

                {/* Location */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    Tu ubicación (nos ayuda a identificar la zona)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Provincia</label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Ciudad</label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-sm"
                        placeholder="Tu ciudad"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-200 border-b-4 border-green-800 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" /> Activar Collar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Necesitás ayuda? Escribinos a{" "}
          <a href="mailto:info@nomepierdo.com" className="text-green-600 underline">info@nomepierdo.com</a>
        </p>
      </div>
    </div>
  );
}
