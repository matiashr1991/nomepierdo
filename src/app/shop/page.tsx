import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Download } from "lucide-react";
import { Logo } from "@/components/Logo";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OrderButton from "./OrderButton";
export default async function ShopPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  
  let pets: any[] = [];
  if (isLoggedIn) {
    pets = await prisma.pet.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, publicCode: true }
    });
  }

  return (
    <div className="min-h-screen bg-[#F8FAF5] font-sans text-gray-800">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo href="/" />
          <nav className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-green-600 font-medium transition-colors border border-gray-200 px-4 py-2 rounded-full text-sm md:text-base md:border-none md:px-0 md:py-0 md:rounded-none">
              Mi Panel
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">
          Tienda Oficial No Me Pierdo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Ya creaste el perfil de tu mascota. Ahora, asegurate de que lo lleve siempre con estilo.
          Podés descargar el QR gratis e imprimirlo por tu cuenta, o encargarnos una chapita premium lista para usar.
        </p>
      </section>

      {/* Free Option Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-16">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Opción 100% Gratuita</h3>
              <p className="text-orange-700">Descargá tu QR desde el panel y usalo como quieras.</p>
            </div>
          </div>
          <Link href="/dashboard" className="shrink-0 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-6 py-2.5 rounded-full font-bold transition-colors">
            Ir a mis mascotas
          </Link>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          
          {/* Product 1: 3D Cat */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 group hover:shadow-xl transition-all">
            <div className="relative h-64 w-full bg-gray-50 overflow-hidden">
              <Image src="/shop/3d_cat.png" alt="Chapita 3D Michi" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Chapita 3D Michi</h3>
              <p className="text-gray-500 mb-6 min-h-[48px]">Silueta de gatito impresa en 3D (PLA biodegradable).<br/><br/><strong>Frente:</strong> Nombre de tu mascota.<br/><strong>Reverso:</strong> Código QR integrado en relieve.</p>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Precio</p>
                  <p className="text-3xl font-extrabold text-green-600">$6.000</p>
                </div>
              </div>
              <OrderButton 
                productName="Chapita 3D Michi" 
                productPrice={6000} 
                pets={pets} 
                isLoggedIn={isLoggedIn} 
              />
            </div>
          </div>

          {/* Product 2: 3D Paw */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 group hover:shadow-xl transition-all relative">
            <div className="absolute top-4 right-4 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Más Vendido
            </div>
            <div className="relative h-64 w-full bg-gray-50 overflow-hidden">
              <Image src="/shop/3d_paw.png" alt="Chapita 3D Huellita" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Chapita 3D Huellita</h3>
              <p className="text-gray-500 mb-6 min-h-[48px]">Impresión 3D con diseño de huella.<br/><br/><strong>Frente:</strong> Nombre de tu mascota en color contraste.<br/><strong>Reverso:</strong> Código QR integrado de forma permanente.</p>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Precio</p>
                  <p className="text-3xl font-extrabold text-green-600">$7.500</p>
                </div>
              </div>
              <OrderButton 
                productName="Chapita 3D Huellita" 
                productPrice={7500} 
                pets={pets} 
                isLoggedIn={isLoggedIn} 
              />
            </div>
          </div>

          {/* Product 3: 3D Bone */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 group hover:shadow-xl transition-all">
            <div className="relative h-64 w-full bg-gray-50 overflow-hidden">
              <Image src="/shop/3d_bone.png" alt="Chapita 3D Huesito" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Chapita 3D Huesito</h3>
              <p className="text-gray-500 mb-6 min-h-[48px]">El formato clásico súper resistente.<br/><br/><strong>Frente:</strong> Nombre de tu mascota.<br/><strong>Reverso:</strong> Código QR escaneable impreso en relieve.</p>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Precio</p>
                  <p className="text-3xl font-extrabold text-green-600">$6.500</p>
                </div>
              </div>
              <OrderButton 
                productName="Chapita 3D Huesito" 
                productPrice={6500} 
                pets={pets} 
                isLoggedIn={isLoggedIn} 
              />
            </div>
          </div>

        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-gray-500 py-12 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <Logo 
              iconClassName="h-6 w-6 text-gray-500" 
              textClassName="text-xl text-gray-500" 
              href={null} 
            />
          </div>
          <p>&copy; {new Date().getFullYear()} No Me Pierdo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
