import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import QrClient from "./QrClient";

export default async function QrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const pet = await prisma.pet.findUnique({
    where: { id }
  });

  if (!pet || pet.userId !== session.user.id) {
    notFound();
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/p/${pet.publicCode}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-8">
        <Link href="/dashboard/pets" className="text-gray-500 hover:text-gray-900 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Código QR: {pet.name}</h1>
      </div>
      
      <QrClient pet={pet} publicUrl={publicUrl} />
    </div>
  );
}
