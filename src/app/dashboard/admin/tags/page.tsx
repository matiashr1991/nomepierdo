import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma, TagStatus } from "@prisma/client";
import { Tags, Package, CheckCircle, AlertTriangle, Ban, Search, QrCode } from "lucide-react";
import Link from "next/link";
import CreateBatchModal from "./CreateBatchModal";
import TagFilters from "./TagFilters";
import TagTable from "./TagTable";

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; batch?: string; q?: string; page?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  // Build filters
  const where: Prisma.QrTagWhereInput = {};
  if (params.status && params.status !== "ALL") {
    where.status = params.status as TagStatus;
  }
  if (params.batch && params.batch !== "ALL") {
    where.batchId = params.batch;
  }
  if (params.q) {
    where.OR = [
      { code: { contains: params.q, mode: "insensitive" } },
      { notes: { contains: params.q, mode: "insensitive" } },
      { pet: { name: { contains: params.q, mode: "insensitive" } } },
    ];
  }

  // Fetch data in parallel
  const [tags, total, stats, batches] = await Promise.all([
    prisma.qrTag.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        batch: { select: { name: true, prefix: true } },
        pet: {
          select: {
            id: true,
            name: true,
            type: true,
            photoUrl: true,
            status: true,
            whatsappPhone: true,
            user: { select: { name: true, email: true } },
          },
        },
        _count: { select: { scans: true } },
      },
    }),
    prisma.qrTag.count({ where }),
    Promise.all([
      prisma.qrTag.count(),
      prisma.qrTag.count({ where: { status: "UNREGISTERED" } }),
      prisma.qrTag.count({ where: { status: "ACTIVE" } }),
      prisma.qrTag.count({ where: { status: "LOST" } }),
      prisma.qrTag.count({ where: { status: "BLOCKED" } }),
    ]),
    prisma.tagBatch.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, prefix: true },
    }),
  ]);

  const [totalTags, unregistered, active, lost, blocked] = stats;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Collares QR</h1>
          <p className="text-gray-500">Generá, buscá y administrá los tags QR para collares.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/tags/batches"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold transition-colors text-sm"
          >
            <Package className="w-5 h-5" /> Ver Lotes
          </Link>
          <CreateBatchModal />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link
          href="/dashboard/admin/tags"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <Tags className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <span className="text-3xl font-black text-gray-900 block">{totalTags}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</span>
        </Link>
        <Link
          href="/dashboard/admin/tags?status=UNREGISTERED"
          className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <QrCode className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <span className="text-3xl font-black text-blue-600 block">{unregistered}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Libres</span>
        </Link>
        <Link
          href="/dashboard/admin/tags?status=ACTIVE"
          className="bg-white p-5 rounded-2xl border border-green-200 shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <span className="text-3xl font-black text-green-600 block">{active}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Activos</span>
        </Link>
        <Link
          href="/dashboard/admin/tags?status=LOST"
          className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <span className="text-3xl font-black text-orange-600 block">{lost}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Perdidos</span>
        </Link>
        <Link
          href="/dashboard/admin/tags?status=BLOCKED"
          className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <Ban className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <span className="text-3xl font-black text-red-600 block">{blocked}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bloqueados</span>
        </Link>
      </div>

      {/* Filters */}
      <TagFilters
        batches={batches}
        currentStatus={params.status}
        currentBatch={params.batch}
        currentSearch={params.q}
      />

      {/* Tags Table */}
      <TagTable tags={tags} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-bold">{skip + 1}-{Math.min(skip + pageSize, total)}</span> de{" "}
            <span className="font-bold">{total}</span> tags
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/admin/tags?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/admin/tags?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tags.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border-4 border-dashed border-gray-100">
          <QrCode className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <p className="text-gray-500 text-xl font-bold">No se encontraron tags.</p>
          <p className="text-gray-400 mt-2">Generá un lote nuevo o ajustá los filtros de búsqueda.</p>
        </div>
      )}
    </div>
  );
}
