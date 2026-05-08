import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Shield, ShieldCheck, ShieldOff, Users, Calendar, Mail } from "lucide-react";
import CreateAdminModal from "./CreateAdminModal";
import UserRoleActions from "./UserRoleActions";

export default async function AdminUsersPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: {
        select: { pets: true },
      },
    },
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const totalUsers = users.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500">Administrá los roles y creá nuevas cuentas de administrador.</p>
        </div>
        <CreateAdminModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
          <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <span className="text-3xl font-black text-gray-900 block">{totalUsers}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Usuarios</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm text-center">
          <ShieldCheck className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <span className="text-3xl font-black text-purple-600 block">{adminCount}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Administradores</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-green-200 shadow-sm text-center">
          <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <span className="text-3xl font-black text-green-600 block">{totalUsers - adminCount}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Usuarios</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Mascotas</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Registrado</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isCurrentUser = user.id === session?.user?.id;
                const isAdmin = user.role === "admin";

                return (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isAdmin ? "bg-purple-50/30" : ""}`}>
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                          {user.image ? (
                            <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-gray-500">
                              {(user.name || user.email)?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{user.name || "Sin nombre"}</p>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                VOS
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-purple-700 bg-purple-100 border border-purple-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200">
                          <Users className="w-3.5 h-3.5" />
                          Usuario
                        </span>
                      )}
                    </td>

                    {/* Pets count */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-700">{user._count.pets}</span>
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(user.createdAt).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <UserRoleActions
                        userId={user.id}
                        isAdmin={isAdmin}
                        isCurrentUser={isCurrentUser}
                        userName={user.name || user.email}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
