"use client";

import { useState } from "react";
import { Plus, X, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { createAdminUser } from "@/actions/users";

export default function CreateAdminModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await createAdminUser(formData);
      setIsOpen(false);
    } catch (error: any) {
      alert(error.message || "Error al crear el administrador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
      >
        <Plus className="w-5 h-5" /> Nuevo Admin
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nuevo Administrador</h2>
                    <p className="text-sm text-gray-500">Creá una cuenta con acceso total al panel</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre completo *</label>
                  <input
                    name="name"
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:outline-none bg-gray-50"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:outline-none bg-gray-50"
                    placeholder="admin@nomepierdo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      className="w-full p-3 pr-12 rounded-xl border border-gray-200 focus:border-purple-500 focus:outline-none bg-gray-50"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Importante:</strong> Esta cuenta tendrá acceso total al panel de administración,
                    incluyendo gestión de productos, pedidos, collares QR y otros administradores.
                  </p>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-6 py-4 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center shadow-lg border-b-4 border-purple-800"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 mr-2" /> Crear Admin
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
