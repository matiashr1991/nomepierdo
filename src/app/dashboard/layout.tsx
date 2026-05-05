import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LayoutDashboard, LogOut, Dog, ShoppingBag, ClipboardList } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#F8FAF5] relative pb-16 md:pb-0">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-shrink-0 flex-col sticky top-0 h-screen">
        <div className="h-full flex flex-col px-4 py-6">
          <div className="mb-8 px-2">
            <Logo href="/dashboard" />
          </div>
          
          <nav className="flex-1 space-y-2">
            <Link 
              href="/dashboard"
              className="flex items-center px-2 py-2 text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-md font-medium transition-colors"
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link 
              href="/dashboard/pets"
              className="flex items-center px-2 py-2 text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-md font-medium transition-colors"
            >
              <Dog className="mr-3 h-5 w-5" />
              Mascotas
            </Link>
            <Link 
              href="/shop"
              className="flex items-center px-2 py-2 text-gray-600 hover:bg-orange-50 hover:text-orange-700 rounded-md font-medium transition-colors"
            >
              <ShoppingBag className="mr-3 h-5 w-5" />
              Tienda
            </Link>

            {isAdmin && (
              <>
                <div className="pt-4 pb-2 px-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administración</p>
                </div>
                <Link 
                  href="/dashboard/admin/orders"
                  className="flex items-center px-2 py-2 text-blue-600 hover:bg-blue-50 rounded-md font-bold transition-colors border border-blue-100"
                >
                  <ClipboardList className="mr-3 h-5 w-5" />
                  Órdenes
                </Link>
                <Link 
                  href="/dashboard/admin/products"
                  className="flex items-center px-2 py-2 text-purple-600 hover:bg-purple-50 rounded-md font-bold transition-colors border border-purple-100"
                >
                  <ShoppingBag className="mr-3 h-5 w-5" />
                  Productos
                </Link>
              </>
            )}
          </nav>
          
          <div className="mt-auto pt-4 border-t border-gray-200">
            <form action={async () => {
              "use server";
              await signOut();
            }}>
              <button className="flex w-full items-center px-2 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium">
                <LogOut className="mr-3 h-5 w-5" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-full overflow-hidden">
        {/* En mobile agregamos un logo simple arriba ya que no hay sidebar */}
        <div className="md:hidden flex justify-center py-4 mb-4 border-b border-gray-200 bg-white -mx-4 -mt-4 px-4 sticky top-0 z-10 shadow-sm">
          <Logo href="/dashboard" />
        </div>
        
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link 
          href="/dashboard"
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-green-600 active:bg-green-50"
        >
          <LayoutDashboard className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-medium">Inicio</span>
        </Link>
        <Link 
          href="/dashboard/pets"
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-green-600 active:bg-green-50"
        >
          <Dog className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-medium">Mascotas</span>
        </Link>
        <Link 
          href="/shop"
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-orange-600 active:bg-orange-50"
        >
          <ShoppingBag className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-medium">Tienda</span>
        </Link>
        <form action={async () => {
          "use server";
          await signOut();
        }} className="w-full h-full">
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-red-600 active:bg-red-50">
            <LogOut className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium">Salir</span>
          </button>
        </form>
      </nav>
    </div>
  );
}
