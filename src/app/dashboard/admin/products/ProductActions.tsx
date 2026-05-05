"use client";

import { Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toggleProductStatus, deleteProduct } from "@/actions/products";
import { useState } from "react";

interface ProductActionsProps {
  productId: string;
  isActive: boolean;
}

export default function ProductActions({ productId, isActive }: ProductActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleProductStatus(productId);
    } catch (error) {
      alert("Error al cambiar estado");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de borrar este producto? Esta acción no se puede deshacer.")) {
      setLoading(true);
      try {
        await deleteProduct(productId);
      } catch (error) {
        alert("Error al borrar producto");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button 
        onClick={handleToggle}
        disabled={loading}
        className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50" 
        title={isActive ? "Pausar" : "Activar"}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />)}
      </button>

      <button 
        onClick={handleDelete}
        disabled={loading}
        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
        title="Borrar"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
