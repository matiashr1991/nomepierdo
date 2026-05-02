import { signOut } from "@/auth";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LayoutDashboard, LogOut, Dog, ShoppingBag } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#F8FAF5]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0">
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
              Mis Mascotas
            </Link>
            <Link 
              href="/shop"
              className="flex items-center px-2 py-2 text-gray-600 hover:bg-orange-50 hover:text-orange-700 rounded-md font-medium transition-colors"
            >
              <ShoppingBag className="mr-3 h-5 w-5" />
              Tienda Oficial
            </Link>
          </nav>
          
          <div className="mt-auto pt-4 border-t border-gray-200">
            <form action={async () => {
              "use server";
              await signOut();
            }}>
              <button className="flex w-full items-center px-2 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium">
                <LogOut className="mr-3 h-5 w-5" />
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
