"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, AlertCircle } from "lucide-react";
import { createOrder } from "@/actions/order";
import { useRouter } from "next/navigation";
import { Pet } from "@prisma/client";

interface OrderButtonProps {
  productId: string;
  productName: string;
  productPrice: number;
  pets: Pick<Pet, "id" | "name" | "publicCode">[];
  isLoggedIn: boolean;
}

export default function OrderButton({ productId, productName, productPrice, pets, isLoggedIn }: OrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleOrder = async () => {
    if (!selectedPetId) return;
    setLoading(true);
    try {
      await createOrder(selectedPetId, productName, productPrice, productId);
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setSelectedPetId("");
      }, 3000);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <button 
        onClick={() => router.push("/login?callbackUrl=/shop")}
        className="w-full flex items-center justify-center bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-xl font-bold transition-colors"
      >
        Iniciá sesión para encargar <ArrowRight className="ml-2 w-5 h-5" />
      </button>
    );
  }

  if (pets.length === 0) {
    return (
      <button 
        onClick={() => router.push("/dashboard")}
        className="w-full flex items-center justify-center bg-gray-100 text-gray-500 px-6 py-3.5 rounded-xl font-bold cursor-not-allowed"
      >
        Primero creá una mascota <AlertCircle className="ml-2 w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-3.5 rounded-xl font-bold transition-colors shadow-md border-b-4 border-green-800"
      >
        Encargar ahora <ArrowRight className="ml-2 w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            {success ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Recibido!</h3>
                <p className="text-gray-600">
                  Ya tenemos tu solicitud para <strong>{productName}</strong>. 
                  En breve nos comunicaremos con vos por WhatsApp para coordinar el diseño y la entrega.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Encargo</h3>
                <p className="text-gray-500 mb-6">
                  Estás encargando una <strong>{productName}</strong> por ${productPrice.toLocaleString('es-AR')}.
                </p>
                
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ¿Para qué mascota es?
                  </label>
                  <select 
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-green-500 focus:outline-none font-medium"
                  >
                    <option value="">Seleccioná una mascota</option>
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>{pet.name} ({pet.publicCode})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-6 py-4 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleOrder}
                    disabled={!selectedPetId || loading}
                    className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Pedido"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
