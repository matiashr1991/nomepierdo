import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BatchPrintClient from "./BatchPrintClient";

export default async function BatchPrintPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const batch = await prisma.tagBatch.findUnique({
    where: { id: batchId },
    include: {
      tags: {
        orderBy: { code: "asc" },
        select: { id: true, code: true, status: true },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div>
      <div className="flex items-center mb-8 print:hidden">
        <Link href="/dashboard/admin/tags" className="text-gray-500 hover:text-gray-900 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Imprimir QRs: {batch.name}</h1>
          <p className="text-gray-500">
            {batch.tags.length} tags · Prefijo: {batch.prefix}
          </p>
        </div>
      </div>

      <BatchPrintClient tags={batch.tags} batchName={batch.name} appUrl={appUrl} />
    </div>
  );
}
