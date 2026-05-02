import Link from "next/link";
import Image from "next/image";
import { Dog, QrCode, Smartphone, RefreshCw, ShieldCheck, Tag, Heart, Shield, Database, Clock, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAF5] flex flex-col font-sans text-gray-800">
      {/* Navbar */}
      <header className="bg-[#F8FAF5]/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo href={null} />
          <nav className="flex items-center space-x-6">
            <Link href="/shop" className="text-gray-500 hover:text-gray-800 font-medium transition-colors">
              Tienda
            </Link>
            <Link href="/login" className="text-gray-500 hover:text-gray-800 font-medium transition-colors">
              Iniciar Sesión
            </Link>
            <Link 
              href="/login" 
              className="bg-green-600 hover:bg-green-800 text-white px-5 py-2.5 rounded-full font-bold transition-transform hover:scale-105 active:scale-95 shadow-md shadow-green-200"
            >
              Comenzar Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAF5] to-green-50 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 font-semibold text-sm mb-8 animate-fade-in-up">
                <span className="flex h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse"></span>
                La identificación más segura y rápida
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-800 tracking-tight mb-8 leading-tight">
                Identidad Digital QR <br className="hidden md:block"/> para mascotas
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Grabá un QR en la chapita de tu perro o gato. Si alguien lo encuentra, puede <strong className="text-gray-800 font-bold">contactarte por WhatsApp al instante.</strong>
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full text-lg shadow-xl shadow-orange-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                >
                  <QrCode className="w-6 h-6 mr-3" />
                  Crear QR para mi mascota
                </Link>
              </div>
            </div>
            
            <div className="flex-1 relative w-full max-w-lg lg:max-w-xl mx-auto">
              <div className="relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image 
                  src="/hero_dog.png" 
                  alt="Perro feliz con chapita QR" 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                <div className="bg-green-100 p-3 rounded-full">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Escaneá para</p>
                  <p className="text-lg font-bold text-gray-800">Enviar WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Nosotros Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600 mb-6 shadow-inner">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">Nacimos por una necesidad real</h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-6">
            Lamentablemente, hoy en día es muy común que las mascotas se extravíen. Las chapitas tradicionales con un número de teléfono grabado suelen rayarse, volverse ilegibles o, peor aún, exponen tu información personal a desconocidos todo el tiempo.
          </p>
          <p className="text-xl text-gray-600 leading-relaxed font-medium bg-green-50 p-6 rounded-2xl border border-green-100">
            Nuestro objetivo es simple: <strong className="text-green-800">Usar la tecnología que ya tenés en el bolsillo para que tu mejor amigo vuelva a casa lo antes posible.</strong>
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">¿Por qué usar No Me Pierdo?</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Mejora la seguridad de tu mejor amigo con tecnología simple pero poderosa.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { icon: RefreshCw, title: "Actualizá cuando quieras", desc: "Cambiás de número o te vas de viaje, podés actualizar tu WhatsApp sin cambiar la chapita física." },
              { icon: ShieldCheck, title: "No mostrás tu dirección", desc: "Protegé tu privacidad. El perfil público solo muestra los datos esenciales para contactarte." },
              { icon: Smartphone, title: "Funciona en cualquier celular", desc: "Quien encuentre a tu mascota solo necesita abrir la cámara de su teléfono, sin instalar apps." },
              { icon: Dog, title: "Ideal para todas las mascotas", desc: "Perros, gatos o cualquier otro animal. Todos merecen estar identificados correctamente." },
              { icon: Tag, title: "Grabalo donde quieras", desc: "Generá tu QR y aplicalo en chapitas de acero, dijes de resina o donde prefieras. Vos tenés el control del formato." },
            ].map((benefit, i) => (
              <div key={i} className="bg-[#F8FAF5] rounded-2xl p-8 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{benefit.title}</h3>
                <p className="text-gray-500 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confiabilidad Section */}
      <section className="py-20 bg-green-50 border-t border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-green-900 mb-4">Confiabilidad absoluta</h2>
            <p className="text-xl text-green-700 max-w-2xl mx-auto">Tu mascota lleva su perfil en el cuello, nosotros nos aseguramos de que siempre esté disponible.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Nunca vencen</h3>
              <p className="text-gray-600">El código QR que generás es para siempre. No caduca por inactividad ni tenés que renovarlo.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Datos seguros</h3>
              <p className="text-gray-600">La información no se borra. Está respaldada de forma segura en la nube para que accedas cuando lo necesites.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Disponible 24/7</h3>
              <p className="text-gray-600">Nuestros servidores están optimizados para garantizar que el perfil cargue al instante, sin importar la hora.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Image Showcase Section */}
      <section className="py-20 bg-[#F8FAF5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-green-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <div className="p-10 md:p-16 flex-1 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Tranquilidad en todo momento</h2>
              <p className="text-green-100 text-lg mb-8 leading-relaxed">
                Tener una chapa tradicional significa que la información puede borrarse, o peor, mostrar tu dirección a desconocidos. Con No Me Pierdo, mantenés el control total de los datos de tu mascota.
              </p>
              <ul className="space-y-4 text-white font-medium">
                <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-400 mr-3" /> Información dinámica</li>
                <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-400 mr-3" /> Privacidad garantizada</li>
                <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-400 mr-3" /> Alerta de pérdida inmediata</li>
              </ul>
            </div>
            <div className="flex-1 relative min-h-[300px] md:min-h-full">
              <Image 
                src="/cat_qr.png" 
                alt="Gato elegante con collar QR" 
                fill 
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>



      {/* CTA Footer */}
      <section className="bg-orange-500 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pattern-diagonal-lines text-white"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">¿Listo para proteger a tu mascota?</h2>
          <p className="text-orange-100 text-xl mb-10">Crear tu cuenta y generar tu primer QR es completamente gratis.</p>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full bg-white text-orange-600 hover:bg-gray-50 shadow-xl transition-transform hover:scale-105 active:scale-95"
          >
            Empezar ahora
          </Link>
        </div>
      </section>
      
      <footer className="bg-gray-800 text-gray-500 py-12 text-center">
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
