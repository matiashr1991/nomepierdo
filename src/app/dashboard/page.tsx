import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Dog, Plus, QrCode } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null; // Middlewares protects this route anyway
  }

  // To run this safely when DB is offline, we should try-catch or assume DB is up.
  // For the MVP, we assume DB is up. 
  let pets: any[] = [];
  try {
    pets = await prisma.pet.findMany({
      where: { userId: session.user.id }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    // Silent fail if DB is not up yet
  }

  const activePets = pets.filter(p => p.status === 'active').length;
  const lostPets = pets.filter(p => p.status === 'lost').length;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Hola, {session.user.name || session.user.email}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 mb-2">{pets.length}</span>
          <span className="text-gray-500 font-medium text-sm uppercase tracking-wider">Mascotas Totales</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-green-600 mb-2">{activePets}</span>
          <span className="text-gray-500 font-medium text-sm uppercase tracking-wider">Activas</span>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-red-600 mb-2">{lostPets}</span>
          <span className="text-gray-500 font-medium text-sm uppercase tracking-wider">Perdidas</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <Dog className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Registra tu primera mascota</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Crea el perfil de tu mascota, genera su código QR y mantén sus datos seguros y actualizados.
        </p>
        <Link 
          href="/dashboard/pets/new" 
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Mascota
        </Link>
      </div>
    </div>
  );
}
