"use client";

import { QrCode, Dog, User, Eye, RotateCcw, Ban, Unlock, ScanLine } from "lucide-react";
import TagActions from "./TagActions";

interface TagTableProps {
  tags: any[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  UNREGISTERED: { label: "Libre", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  ACTIVE: { label: "Activo", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  LOST: { label: "Perdido", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  BLOCKED: { label: "Bloqueado", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

export default function TagTable({ tags }: TagTableProps) {
  if (tags.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Mascota
              </th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Dueño
              </th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Lote
              </th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-center">
                Escaneos
              </th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tags.map((tag) => {
              const status = statusConfig[tag.status] || statusConfig.UNREGISTERED;

              return (
                <tr key={tag.id} className="hover:bg-gray-50 transition-colors">
                  {/* Code */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-white" />
                      </div>
                      <code className="font-mono font-bold text-gray-900 text-sm tracking-wider">
                        {tag.code}
                      </code>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${status.color} ${status.bg} border ${status.border}`}
                    >
                      {status.label}
                    </span>
                  </td>

                  {/* Pet */}
                  <td className="px-6 py-4">
                    {tag.pet ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                          {tag.pet.photoUrl ? (
                            <img
                              src={tag.pet.photoUrl}
                              alt={tag.pet.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Dog className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{tag.pet.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{tag.pet.type}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Sin asignar</span>
                    )}
                  </td>

                  {/* Owner */}
                  <td className="px-6 py-4">
                    {tag.pet?.user ? (
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{tag.pet.user.name}</p>
                        <p className="text-xs text-gray-500">{tag.pet.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">—</span>
                    )}
                  </td>

                  {/* Batch */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                      {tag.batch.name}
                    </span>
                  </td>

                  {/* Scans */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ScanLine className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-gray-700 text-sm">{tag._count.scans}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <TagActions tagId={tag.id} tagCode={tag.code} status={tag.status} hasPet={!!tag.pet} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
