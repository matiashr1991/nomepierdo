import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Printer, Package, QrCode, CheckCircle, AlertTriangle, Ban, Calendar } from "lucide-react";

export default async function AdminBatchesPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const batches = await prisma.tagBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true, email: true } },
      tags: { select: { status: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/tags" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lotes Generados</h1>
            <p className="text-gray-500">Historial de lotes de tags QR generados.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {batches.map((batch) => {
          const statusCounts = {
            UNREGISTERED: batch.tags.filter((t) => t.status === "UNREGISTERED").length,
            ACTIVE: batch.tags.filter((t) => t.status === "ACTIVE").length,
            LOST: batch.tags.filter((t) => t.status === "LOST").length,
            BLOCKED: batch.tags.filter((t) => t.status === "BLOCKED").length,
          };

          return (
            <div
              key={batch.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shrink-0">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{batch.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {new Date(batch.createdAt).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-sm text-gray-500">
                        Prefijo: <code className="font-mono font-bold">{batch.prefix}</code>
                      </span>
                      <span className="text-sm text-gray-500">
                        Por: {batch.createdBy.name || batch.createdBy.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/admin/tags?batch=${batch.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    Ver Tags
                  </Link>
                  <Link
                    href={`/dashboard/admin/tags/print/${batch.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir QRs
                  </Link>
                </div>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                  <QrCode className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="text-lg font-black text-blue-600">{statusCounts.UNREGISTERED}</span>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Libres</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <span className="text-lg font-black text-green-600">{statusCounts.ACTIVE}</span>
                    <p className="text-[10px] font-bold text-green-400 uppercase">Activos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <div>
                    <span className="text-lg font-black text-orange-600">{statusCounts.LOST}</span>
                    <p className="text-[10px] font-bold text-orange-400 uppercase">Perdidos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2">
                  <Ban className="w-4 h-4 text-red-500" />
                  <div>
                    <span className="text-lg font-black text-red-600">{statusCounts.BLOCKED}</span>
                    <p className="text-[10px] font-bold text-red-400 uppercase">Bloqueados</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {batches.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border-4 border-dashed border-gray-100">
            <Package className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <p className="text-gray-500 text-xl font-bold">No hay lotes generados.</p>
            <p className="text-gray-400 mt-2">
              Generá tu primer lote desde la{" "}
              <Link href="/dashboard/admin/tags" className="text-green-600 underline font-bold">
                página de Tags
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
