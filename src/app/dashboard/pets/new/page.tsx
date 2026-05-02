"use client";

import { useState } from "react";
import { createPet } from "@/actions/pet";
import Link from "next/link";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Image from "next/image";

export default function NewPetPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-8">
        <Link href="/dashboard/pets" className="text-gray-500 hover:text-gray-900 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Registrar Nueva Mascota</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form 
          action={async (formData) => {
            setIsSubmitting(true);
            try {
              await createPet(formData);
            } catch (error) {
              console.error(error);
              setIsSubmitting(false);
            }
          }}
          className="p-4 md:p-6"
        >
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Foto (Columna Izquierda) */}
            <div className="md:w-1/3 flex flex-col items-center justify-start space-y-4">
              <label className="block text-sm font-medium text-gray-700 text-center">Foto de la Mascota</label>
              <div className="h-32 w-32 relative rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                ) : (
                  <span className="text-gray-400">Sin foto</span>
                )}
              </div>
              <div className="text-center">
                <label htmlFor="photo" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir imagen
                </label>
                <input id="photo" name="photo" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <p className="mt-2 text-xs text-gray-500">JPG, PNG o GIF. Máx 5MB.</p>
              </div>
            </div>

            {/* Datos (Columna Derecha) */}
            <div className="md:w-2/3 space-y-4">
              {/* Nombre y Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input required type="text" id="name" name="name" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Ej: Luna" />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select required id="type" name="type" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white">
                    <option value="perro">Perro</option>
                    <option value="gato">Gato</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="whatsappPhone" className="block text-sm font-medium text-gray-700 mb-1">Número de WhatsApp *</label>
                <input required type="tel" id="whatsappPhone" name="whatsappPhone" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Ej: 5491123456789" />
                <p className="mt-1 text-xs text-gray-500">Incluye el código de país (ej. 549 para Argentina). Solo números.</p>
              </div>

              {/* Mensaje Público */}
              <div>
                <label htmlFor="publicMessage" className="block text-sm font-medium text-gray-700 mb-1">Mensaje Público (Opcional)</label>
                <textarea id="publicMessage" name="publicMessage" rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none" placeholder="Añade información relevante (ej. requiere medicación, es asustadiza, etc.)"></textarea>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <Link href="/dashboard/pets" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3 transition-colors">
              Cancelar
            </Link>
            <button disabled={isSubmitting} type="submit" className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors">
              {isSubmitting ? "Guardando..." : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Mascota
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
