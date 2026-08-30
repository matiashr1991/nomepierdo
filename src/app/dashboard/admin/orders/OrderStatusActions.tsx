"use client";

import { updateOrderStatus } from "@/actions/order";
import { useState } from "react";
import { CheckCircle, XCircle, Phone, Loader2 } from "lucide-react";
import { OrderStatus } from "@prisma/client";

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusActions({ orderId, currentStatus }: OrderStatusActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (newStatus === "CANCELLED" && !confirm("¿Seguro que quieres cancelar esta orden?")) return;
    
    setLoading(true);
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "PENDING" && (
        <button 
          onClick={() => handleStatusUpdate("CONTACTED")}
          disabled={loading}
          className="flex items-center bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
          Marcar Contactado
        </button>
      )}

      {(currentStatus === "PENDING" || currentStatus === "CONTACTED") && (
        <button 
          onClick={() => handleStatusUpdate("COMPLETED")}
          disabled={loading}
          className="flex items-center bg-green-50 text-green-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Venta Efectiva
        </button>
      )}

      {currentStatus !== "CANCELLED" && currentStatus !== "COMPLETED" && (
        <button 
          onClick={() => handleStatusUpdate("CANCELLED")}
          disabled={loading}
          className="flex items-center bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Cancelar
        </button>
      )}

      {currentStatus === "COMPLETED" && (
        <span className="flex items-center text-green-600 font-black text-sm bg-green-50 px-4 py-2 rounded-xl border border-green-200">
          <CheckCircle className="w-4 h-4 mr-2" />
          ORDEN COMPLETADA
        </span>
      )}

      {currentStatus === "CANCELLED" && (
        <span className="flex items-center text-red-600 font-black text-sm bg-red-50 px-4 py-2 rounded-xl border border-red-200">
          <XCircle className="w-4 h-4 mr-2" />
          ORDEN CANCELADA
        </span>
      )}
    </div>
  );
}
