"use client";

import { useState } from "react";
import { Plus, Edit, X, Loader2, Upload, Trash2 } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/products";
import Image from "next/image";

interface ProductFormModalProps {
  product?: any;
  isEdit?: boolean;
}

export default function ProductFormModal({ product, isEdit = false }: ProductFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(product?.image || null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      if (isEdit) {
        await updateProduct(product.id, formData);
      } else {
        await createProduct(formData);
      }
      setIsOpen(false);
      if (!isEdit) setPreview(null);
    } catch (error) {
      console.error(error);
      alert("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={isEdit 
          ? "p-2 text-gray-400 hover:text-green-600 transition-colors" 
          : "flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
        }
      >
        {isEdit ? <Edit className="w-5 h-5" /> : <><Plus className="w-5 h-5" /> Nuevo Producto</>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEdit ? "Editar Producto" : "Nuevo Producto"}
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Imagen del Producto</label>
                    <div className="relative group aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden transition-colors hover:border-green-500">
                      {preview ? (
                        <>
                          <Image src={preview} alt="Preview" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">
                              Cambiar
                              <input type="file" name="image" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                            {isEdit && (
                              <button 
                                type="button" 
                                onClick={() => {setPreview(null);}}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                          <Upload className="w-10 h-10 text-gray-300 mb-2" />
                          <span className="text-sm text-gray-500 font-medium">Subir Imagen</span>
                          <input type="file" name="image" className="hidden" accept="image/*" onChange={handleImageChange} required={!isEdit} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                      <input 
                        name="name" 
                        defaultValue={product?.name} 
                        required 
                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50"
                        placeholder="Ej: Chapita Huesito 3D"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Precio ($)</label>
                      <input 
                        type="number" 
                        name="price" 
                        defaultValue={product?.price} 
                        required 
                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50"
                        placeholder="7500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Stock</label>
                      <input 
                        type="number" 
                        name="stock" 
                        defaultValue={product?.stock || 0} 
                        required 
                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50"
                        placeholder="50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                  <textarea 
                    name="description" 
                    defaultValue={product?.description} 
                    rows={4}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50"
                    placeholder="Contanos más sobre el producto..."
                  />
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
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? "Guardar Cambios" : "Crear Producto")}
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
