import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Image from "next/image";
import { updatePet } from "@/actions/pet";
import { notFound } from "next/navigation";

export default async function EditPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const pet = await prisma.pet.findUnique({
    where: { id }
  });

  if (!pet || pet.userId !== session.user.id) {
    notFound();
  }

  // To handle the file input state, we need a Client Component for the form,
  // or just use native form behavior, but since we have an image preview we'll make a smaller client component
  // or we can just use "use client" on the whole page and fetch the initial data from server.
  // We'll pass the pet data to a Client Component.
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-8">
        <Link href="/dashboard/pets" className="text-gray-500 hover:text-gray-900 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Mascota</h1>
      </div>
      
      <EditPetForm pet={pet} />
    </div>
  );
}

// Since we cannot put "use client" and "use server" actions easily in the same file if we need `async` Server Components,
// We will just do a standard form with a Server Action.

import EditPetForm from "./EditPetForm";
