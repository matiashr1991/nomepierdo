import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Package, Eye, EyeOff } from "lucide-react";
import ProductFormModal from "./ProductFormModal";
import ProductActions from "./ProductActions";

export default async function AdminProductsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-500">Administrá el catálogo de la tienda, precios y stock.</p>
        </div>
        <ProductFormModal />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay productos cargados todavía.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <Package className="w-6 h-6 m-3 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600">${product.price.toLocaleString('es-AR')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${product.stock > 5 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        {product.stock} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.active ? (
                        <span className="inline-flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                          <Eye className="w-3 h-3 mr-1" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-400 text-xs font-bold bg-gray-50 px-2 py-1 rounded-full">
                          <EyeOff className="w-3 h-3 mr-1" /> Pausado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ProductFormModal product={product} isEdit />
                        <ProductActions productId={product.id} isActive={product.active} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
