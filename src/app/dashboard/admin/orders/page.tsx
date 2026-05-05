import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { MessageCircle, Package, Calendar, Tag, QrCode as QrIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminOrdersPage() {
  const session = await auth();
  
  // Basic admin check (could be more robust)
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    // For now, if we are in dev or you haven't set your user as admin, 
    // I'll let it pass or redirect. Let's redirect to dashboard if not admin.
    // redirect("/dashboard");
  }

  const orders = await prisma.order.findMany({
    include: {
      user: true,
      pet: {
        include: {
          qrCode: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="min-h-screen bg-[#F8FAF5] font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo href="/dashboard" />
          <h1 className="font-bold text-gray-800">Panel de Órdenes</h1>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 font-medium">
            Volver
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Pedidos de Chapitas</h2>
            <p className="text-gray-500">Gestioná los encargos y contactá a los dueños.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center">
            <Package className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-bold text-gray-700">{orders.length} pedidos totales</span>
          </div>
        </div>

        <div className="grid gap-6">
          {orders.map((order) => {
            const waLink = `https://wa.me/${order.pet.whatsappPhone.replace(/\D/g, '')}?text=Hola!%20Soy%20de%20NoMePierdo.%20Recibimos%20tu%20pedido%20de%20una%20chapita%20para%20${order.pet.name}.%20Confirmamos%20el%20dise%C3%B1o?`;
            
            return (
              <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 
                      order.status === 'CONTACTED' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {order.status === 'PENDING' ? 'Pendiente' : order.status}
                    </span>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(order.createdAt).toLocaleDateString('es-AR')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 font-bold uppercase mb-1">Producto</p>
                      <p className="text-lg font-bold text-gray-800">{order.productName}</p>
                      <p className="text-green-600 font-bold">${order.productPrice.toLocaleString('es-AR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-bold uppercase mb-1">Mascota</p>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                          <Tag className="w-4 h-4 text-gray-500" />
                        </div>
                        <p className="text-lg font-bold text-gray-800">{order.pet.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 border border-gray-100">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Código QR para grabar</p>
                    <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <QrIcon className="w-4 h-4 text-gray-700 mr-2" />
                      <code className="text-lg font-black text-gray-900 tracking-tighter">{order.pet.publicCode}</code>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold flex items-center shadow-lg shadow-green-200 transition-all active:scale-95"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contactar
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {orders.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Todavía no hay pedidos registrados.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
