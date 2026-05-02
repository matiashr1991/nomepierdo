import { signIn } from "@/auth";
import { Logo } from "@/components/Logo";
import { QrCode, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF5] flex">
      {/* Columna Izquierda - Formulario */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <Logo className="mb-8" href="/" />
            <h2 className="text-3xl font-extrabold text-gray-900">Bienvenido de nuevo</h2>
            <p className="mt-2 text-sm text-gray-600">
              Iniciá sesión para administrar las identificaciones de tus mascotas.
            </p>
          </div>

          <div className="mt-8">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Image 
                  src="https://www.svgrepo.com/show/475656/google-color.svg" 
                  alt="Google" 
                  width={20} 
                  height={20} 
                  className="mr-3"
                />
                Continuar con Google
              </button>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#F8FAF5] text-gray-500">Privacidad ante todo</span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p className="flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                No publicaremos nada sin tu permiso
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha - Imagen */}
      <div className="hidden lg:block relative w-0 flex-1 bg-green-800">
        <Image
          className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-multiply"
          src="/hero_dog.png"
          alt="Perro feliz con chapita QR"
          fill
        />
        <div className="absolute inset-0 flex flex-col justify-center px-20">
          <h2 className="text-4xl font-extrabold text-white mb-6">Protegé a lo que más querés</h2>
          <p className="text-xl text-green-100 max-w-lg leading-relaxed">
            Un perfil digital seguro y un código QR pueden hacer la diferencia entre que tu mascota vuelva a casa en minutos o en días.
          </p>
        </div>
      </div>
    </div>
  );
}
