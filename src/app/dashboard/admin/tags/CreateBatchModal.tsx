"use client";

import { useState } from "react";
import { Plus, X, Loader2, Package } from "lucide-react";
import { createBatch } from "@/actions/tags";

export default function CreateBatchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await createBatch(formData);
      setIsOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al crear el lote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
      >
        <Plus className="w-5 h-5" /> Generar Lote
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nuevo Lote de Tags</h2>
                    <p className="text-sm text-gray-500">Generá códigos QR para collares</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Nombre del Lote *
                  </label>
                  <input
                    name="name"
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50"
                    placeholder="Ej: Lote Mayo 2026 - Posadas"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Prefijo
                    </label>
                    <input
                      name="prefix"
                      defaultValue="NMP"
                      maxLength={5}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 font-mono uppercase"
                      placeholder="NMP"
                    />
                    <p className="mt-1 text-xs text-gray-400">Formato: NMP-XXXXXX</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      min={1}
                      max={500}
                      defaultValue={10}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50"
                      placeholder="50"
                    />
                    <p className="mt-1 text-xs text-gray-400">Máximo 500 por lote</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>¿Cómo funciona?</strong> Se generarán códigos QR únicos con el formato{" "}
                    <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-bold">PREFIJO-XXXXXX</code>.
                    Cada código se puede imprimir en un collar y se puede escanear para activarlo.
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
                    className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center shadow-lg border-b-4 border-green-800"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" /> Generar Tags
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
