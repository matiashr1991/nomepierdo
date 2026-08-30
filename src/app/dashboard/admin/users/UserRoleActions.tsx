"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { promoteToAdmin, demoteFromAdmin } from "@/actions/users";

interface UserRoleActionsProps {
  userId: string;
  isAdmin: boolean;
  isCurrentUser: boolean;
  userName: string;
}

export default function UserRoleActions({ userId, isAdmin, isCurrentUser, userName }: UserRoleActionsProps) {
  const [loading, setLoading] = useState(false);

  const handlePromote = async () => {
    if (!confirm(`¿Hacer admin a "${userName}"? Tendrá acceso total al panel de administración.`)) return;
    setLoading(true);
    try {
      await promoteToAdmin(userId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al promover usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleDemote = async () => {
    if (!confirm(`¿Quitar admin a "${userName}"? Perderá acceso al panel de administración.`)) return;
    setLoading(true);
    try {
      await demoteFromAdmin(userId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al cambiar rol");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-gray-400 ml-auto" />;
  }

  // Can't change own role
  if (isCurrentUser) {
    return (
      <span className="text-xs text-gray-400 font-medium italic">Cuenta actual</span>
    );
  }

  if (isAdmin) {
    return (
      <button
        onClick={handleDemote}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
      >
        <ShieldOff className="w-4 h-4" />
        Quitar Admin
      </button>
    );
  }

  return (
    <button
      onClick={handlePromote}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-200"
    >
      <ShieldCheck className="w-4 h-4" />
      Hacer Admin
    </button>
  );
}
