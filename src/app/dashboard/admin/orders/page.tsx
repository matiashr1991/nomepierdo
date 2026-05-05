import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { MessageCircle, Package, Calendar, Tag, QrCode as QrIcon, User as UserIcon } from "lucide-react";
import { redirect } from "next/navigation";
import OrderStatusActions from "./OrderStatusActions";

export default async function AdminOrdersPage() {
  const session = await auth();
  
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    redirect("/dashboard");
  }

  const orders = await prisma.order.findMany({
    include: {
      user: true,
      pet: true
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
          <h1 className="font-bold text-gray-800 uppercase tracking-widest text-sm">Panel de Administración</h1>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 font-medium border border-gray-200 px-4 py-2 rounded-full transition-colors">
            Volver
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Pedidos de Chapitas</h2>
            <p className="text-gray-500 text-lg">Gestioná los encargos y confirmá las ventas efectivas.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border border-gray-200 shadow-sm flex items-center shrink-0">
            <Package className="w-6 h-6 text-green-600 mr-3" />
            <span className="font-bold text-gray-700 text-lg">{orders.length} pedidos totales</span>
          </div>
        </div>

        <div className="grid gap-8">
          {orders.map((order) => {
            const waLink = `https://wa.me/${order.pet.whatsappPhone.replace(/\D/g, '')}?text=Hola!%20Soy%20de%20NoMePierdo.%20Recibimos%20tu%20pedido%20de%20una%20chapita%20para%20${order.pet.name}.%20Confirmamos%20el%20dise%C3%B1o?`;
            
            return (
              <div key={order.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-8 hover:shadow-xl transition-all duration-300 border-l-8 border-l-green-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                        order.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 
                        order.status === 'CONTACTED' ? 'bg-blue-100 text-blue-600' : 
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {order.status === 'PENDING' ? 'Pendiente' : 
                         order.status === 'CONTACTED' ? 'Contactado' : 
                         order.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}
                      </span>
                      <div className="flex items-center text-gray-400 font-bold text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center">
                          <Package className="w-3 h-3 mr-1" /> Producto
                        </p>
                        <p className="text-xl font-black text-gray-900">{order.productName}</p>
                        <p className="text-green-600 font-black text-lg">${order.productPrice.toLocaleString('es-AR')}</p>
                      </div>

                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center">
                          <Tag className="w-3 h-3 mr-1" /> Mascota
                        </p>
                        <p className="text-xl font-black text-gray-900">{order.pet.name}</p>
                        <p className="text-gray-500 font-medium text-sm">Código: {order.pet.publicCode}</p>
                      </div>

                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center">
                          <UserIcon className="w-3 h-3 mr-1" /> Dueño
                        </p>
                        <p className="text-xl font-black text-gray-900">{order.user.name}</p>
                        <p className="text-gray-500 font-medium text-sm">{order.user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 shrink-0 min-w-[200px]">
                    <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center">
                        <QrIcon className="w-3 h-3 mr-1" /> QR a Grabar
                      </p>
                      <code className="text-2xl font-black block text-center tracking-wider">{order.pet.publicCode}</code>
                    </div>
                    
                    <a 
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center shadow-xl shadow-green-100 transition-all active:scale-95"
                    >
                      <MessageCircle className="w-6 h-6 mr-3" />
                      Contactar WA
                    </a>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Acciones de Gestión</p>
                  <OrderStatusActions orderId={order.id} currentStatus={order.status} />
                </div>
              </div>
            );
          })}

          {orders.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
              <Package className="w-20 h-20 text-gray-200 mx-auto mb-6" />
              <p className="text-gray-500 text-xl font-bold">Todavía no hay pedidos registrados.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
