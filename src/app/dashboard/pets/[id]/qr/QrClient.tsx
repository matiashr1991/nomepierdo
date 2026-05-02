"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Copy, ExternalLink, Check, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function QrClient({ pet, publicUrl }: { pet: any, publicUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, publicUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      }, (error) => {
        if (error) console.error("Error generating QR:", error);
      });
    }
  }, [publicUrl]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPng = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `nomepierdo-${pet.name.toLowerCase()}-${pet.publicCode}.png`;
      a.click();
    }
  };

  const downloadSvg = async () => {
    try {
      const svgString = await QRCode.toString(publicUrl, { type: 'svg', width: 300, margin: 2 });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nomepierdo-${pet.name.toLowerCase()}-${pet.publicCode}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* QR Display */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 inline-block">
          <canvas ref={canvasRef} className="mx-auto"></canvas>
        </div>
        <p className="font-mono text-xl font-bold tracking-widest text-gray-800">{pet.publicCode}</p>
        <p className="text-sm text-gray-500 mt-2 text-center">Este código es único para {pet.name}. Grábalo en su chapita o collar.</p>
      </div>

      {/* Actions */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Descargar Código QR</h3>
          <div className="space-y-3">
            <button onClick={downloadPng} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg font-medium text-gray-700 transition-colors">
              <span className="flex items-center"><Download className="w-5 h-5 mr-3 text-blue-600" /> Formato PNG</span>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">Ideal para imprimir</span>
            </button>
            <button onClick={downloadSvg} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg font-medium text-gray-700 transition-colors">
              <span className="flex items-center"><Download className="w-5 h-5 mr-3 text-purple-600" /> Formato SVG</span>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">Ideal para grabado láser</span>
            </button>
          </div>
        </div>

        {/* Upsell Shop */}
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-16 h-16 text-orange-600" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-orange-900 mb-2">¿Querés la chapita física ya lista?</h3>
            <p className="text-sm text-orange-800 mb-4">Te la enviamos impresa en 3D de alta resistencia y con colores vibrantes, lista para colgar en el collar.</p>
            <Link href="/shop" className="inline-flex w-full items-center justify-center px-4 py-3 bg-orange-500 hover:bg-orange-600 border border-transparent rounded-lg font-bold text-white transition-colors shadow-md">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Ver opciones en la Tienda
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Enlace Público</h3>
          <p className="text-sm text-gray-600 mb-3">Esta es la dirección a la que apunta el QR.</p>
          <div className="flex">
            <input 
              type="text" 
              readOnly 
              value={publicUrl} 
              className="flex-1 min-w-0 rounded-l-md border border-r-0 border-gray-300 px-3 py-2 text-sm text-gray-600 bg-gray-50 focus:outline-none"
            />
            <button 
              onClick={copyUrl}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-4 text-center">
            <Link 
              href={`/p/${pet.publicCode}`}
              target="_blank"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Probar enlace público
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
