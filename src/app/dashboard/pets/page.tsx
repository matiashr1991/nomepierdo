import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, QrCode, Edit, Eye, Search } from "lucide-react";
import Image from "next/image";

export default async function PetsPage() {
  const session = await auth();
  
  if (!session?.user?.id) return null;

  let pets: any[] = [];
  try {
    pets = await prisma.pet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Database connection error:", error);
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activa</span>;
      case 'lost':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Perdida</span>;
      case 'inactive':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactiva</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Mascotas</h1>
        <Link 
          href="/dashboard/pets/new" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Mascota
        </Link>
      </div>

      {pets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay mascotas registradas</h3>
          <p className="text-gray-500 mb-4">Aún no has agregado ninguna mascota a tu perfil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-100 relative">
                {pet.photoUrl ? (
                  <Image 
                    src={pet.photoUrl} 
                    alt={pet.name} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Sin foto
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(pet.status)}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{pet.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{pet.type}</p>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                    ID: {pet.publicCode}
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <Link 
                    href={`/dashboard/pets/${pet.id}/edit`}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Link>
                  <Link 
                    href={`/dashboard/pets/${pet.id}/qr`}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Código QR
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
