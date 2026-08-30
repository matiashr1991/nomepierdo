"use client";

import { useState } from "react";
import { RotateCcw, Ban, Unlock, Loader2, MoreVertical, FileText, ExternalLink } from "lucide-react";
import { resetTag, blockTag, unblockTag, updateTagNotes } from "@/actions/tags";

interface TagActionsProps {
  tagId: string;
  tagCode: string;
  status: string;
  hasPet: boolean;
}

export default function TagActions({ tagId, tagCode, status, hasPet }: TagActionsProps) {
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const handleAction = async (action: () => Promise<void>, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setLoading(true);
    setMenuOpen(false);
    try {
      await action();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al ejecutar la acción");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      await updateTagNotes(tagId, notes);
      setNotesOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al guardar notas");
    } finally {
      setLoading(false);
    }
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (loading) {
    return (
      <div className="flex justify-end">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-1">
        {/* Quick view link */}
        <a
          href={`${appUrl}/t/${tagCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Ver página pública"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* More menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[101] w-56 py-2 animate-in fade-in zoom-in duration-150">
            {/* Reset / Blanquear */}
            {(status === "ACTIVE" || status === "LOST") && (
              <button
                onClick={() =>
                  handleAction(
                    () => resetTag(tagId),
                    `¿Blanquear el tag ${tagCode}? Se desvinculará la mascota y volverá a estar libre.`
                  )
                }
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="font-bold">Blanquear</span>
              </button>
            )}

            {/* Block */}
            {status !== "BLOCKED" && (
              <button
                onClick={() =>
                  handleAction(
                    () => blockTag(tagId),
                    `¿Bloquear el tag ${tagCode}? No podrá ser registrado ni mostrará información.`
                  )
                }
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Ban className="w-4 h-4" />
                <span className="font-bold">Bloquear</span>
              </button>
            )}

            {/* Unblock */}
            {status === "BLOCKED" && (
              <button
                onClick={() =>
                  handleAction(
                    () => unblockTag(tagId),
                    `¿Desbloquear el tag ${tagCode}? Volverá a estar disponible como "Libre".`
                  )
                }
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-green-600 hover:bg-green-50 transition-colors"
              >
                <Unlock className="w-4 h-4" />
                <span className="font-bold">Desbloquear</span>
              </button>
            )}

            {/* Notes */}
            <button
              onClick={() => {
                setMenuOpen(false);
                setNotesOpen(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">Editar notas</span>
            </button>
          </div>
        </>
      )}

      {/* Notes Modal */}
      {notesOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Notas del Tag</h3>
            <p className="text-sm text-gray-500 mb-4">
              Código: <code className="font-mono font-bold">{tagCode}</code>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 resize-none text-sm"
              placeholder="Agregar notas internas sobre este tag..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setNotesOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
