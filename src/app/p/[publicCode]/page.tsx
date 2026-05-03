import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Dog, MessageCircleWarning, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LocationButton } from "@/components/LocationButton";

export async function generateMetadata({ params }: { params: Promise<{ publicCode: string }> }) {
  const { publicCode } = await params;
  // We don't want these indexed
  return {
    title: "Perfil de Mascota - No Me Pierdo",
    robots: {
      index: false,
      follow: false,
    }
  };
}

export default async function PublicPetPage({ params }: { params: Promise<{ publicCode: string }> }) {
  const { publicCode } = await params;
  const pet = await prisma.pet.findUnique({
    where: { publicCode }
  });

  if (!pet || pet.status === 'deleted') {
    notFound();
  }

  if (pet.status === 'inactive') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dog className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Perfil Inactivo</h1>
          <p className="text-gray-500">Este perfil de mascota no está disponible actualmente.</p>
        </div>
      </div>
    );
  }

  const isLost = pet.status === 'lost';
  const whatsappUrl = `https://wa.me/${pet.whatsappPhone}?text=${encodeURIComponent(
    isLost 
      ? `Hola, encontré a ${pet.name}. ¡Está conmigo!` 
      : `Hola, estoy viendo la chapita de ${pet.name}.`
  )}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <Logo href={null} textClassName="text-3xl bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent" iconClassName="h-10 w-10 text-green-600" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header Image */}
          <div className="h-64 bg-gray-200 relative">
            {pet.photoUrl ? (
              <img
                src={pet.photoUrl} 
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50">
                <Dog className="w-24 h-24 text-blue-200" />
              </div>
            )}
            
            {/* Status Badge */}
            {isLost && (
              <div className="absolute top-4 left-4 right-4 bg-red-600 text-white py-2 px-4 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <ShieldAlert className="w-5 h-5 mr-2" />
                <span className="font-bold uppercase tracking-wider text-sm">Mascota Perdida</span>
              </div>
            )}
          </div>

          <div className="p-8 text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
              {isLost ? `${pet.name} te necesita` : `Hola, soy ${pet.name}`}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {isLost 
                ? "Por favor, contacta a mi dueño urgente si me encontraste." 
                : "Si me encontraste o necesitas contactar a mi dueño, toca el botón abajo."}
            </p>

            {pet.publicMessage && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-8 text-left">
                <h3 className="font-bold text-orange-800 mb-1 flex items-center text-sm uppercase tracking-wider">
                  <MessageCircleWarning className="w-4 h-4 mr-1.5" /> 
                  Información Importante
                </h3>
                <p className="text-orange-900 leading-relaxed">{pet.publicMessage}</p>
              </div>
            )}

            <LocationButton 
              publicCode={pet.publicCode}
              whatsappPhone={pet.whatsappPhone}
              petName={pet.name}
              isLost={isLost}
            />
          </div>
          
          <div className="bg-gray-50 border-t border-gray-100 p-6 text-center">
            <p className="text-xs text-gray-400 font-medium">
              Este perfil pertenece a una mascota registrada en <span className="text-gray-600 font-bold">No Me Pierdo</span>.
              <br/>ID: <span className="font-mono">{pet.publicCode}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
