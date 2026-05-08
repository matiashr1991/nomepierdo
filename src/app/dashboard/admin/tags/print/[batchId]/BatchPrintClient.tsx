"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Printer, Download, Grid3X3, LayoutList, Loader2 } from "lucide-react";

interface Tag {
  id: string;
  code: string;
  status: string;
}

interface BatchPrintClientProps {
  tags: Tag[];
  batchName: string;
  appUrl: string;
}

type LayoutMode = "grid" | "list";

export default function BatchPrintClient({ tags, batchName, appUrl }: BatchPrintClientProps) {
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [qrSize, setQrSize] = useState(150);
  const [loading, setLoading] = useState(true);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Generate all QR codes
  useEffect(() => {
    const generateAll = async () => {
      setLoading(true);
      for (const tag of tags) {
        const canvas = canvasRefs.current.get(tag.code);
        if (canvas) {
          const targetUrl = `${appUrl}/t/${tag.code}`;
          try {
            await QRCode.toCanvas(canvas, targetUrl, {
              width: qrSize,
              margin: 1,
              color: { dark: "#000000", light: "#ffffff" },
              errorCorrectionLevel: "H",
            });
          } catch (err) {
            console.error(`Error generating QR for ${tag.code}:`, err);
          }
        }
      }
      setLoading(false);
    };
    // Small delay to let refs mount
    const timer = setTimeout(generateAll, 100);
    return () => clearTimeout(timer);
  }, [tags, appUrl, qrSize]);

  const handlePrint = () => {
    window.print();
  };

  const downloadAllPng = async () => {
    // Download individual PNGs as a zip would be complex, so we download them one by one
    for (const tag of tags) {
      const canvas = canvasRefs.current.get(tag.code);
      if (canvas) {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `${tag.code}.png`;
        a.click();
        // Small delay between downloads
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  };

  const setCanvasRef = (code: string) => (el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(code, el);
    }
  };

  return (
    <div>
      {/* Controls - hidden when printing */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          {/* Layout toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setLayout("grid")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                layout === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Grid3X3 className="w-4 h-4" /> Grilla
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                layout === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutList className="w-4 h-4" /> Lista
            </button>
          </div>

          {/* Size control */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-gray-600">Tamaño QR:</label>
            <select
              value={qrSize}
              onChange={(e) => setQrSize(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 font-medium"
            >
              <option value={100}>Pequeño (100px)</option>
              <option value={150}>Mediano (150px)</option>
              <option value={200}>Grande (200px)</option>
              <option value={300}>Extra Grande (300px)</option>
            </select>
          </div>

          <div className="flex-1" />

          {/* Action buttons */}
          <button
            onClick={downloadAllPng}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Descargar PNGs
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-12 print:hidden">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mr-3" />
          <span className="text-gray-500 font-medium">Generando {tags.length} códigos QR...</span>
        </div>
      )}

      {/* Grid Layout */}
      {layout === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 print:grid-cols-4 print:gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center print:rounded-none print:border-gray-300 print:p-2 break-inside-avoid"
            >
              <canvas ref={setCanvasRef(tag.code)} className="mb-2" />
              <code className="font-mono font-bold text-xs text-gray-800 tracking-wider text-center">
                {tag.code}
              </code>
              <p className="text-[8px] text-gray-400 mt-1 print:text-[6px]">nomepierdo.com</p>
            </div>
          ))}
        </div>
      )}

      {/* List Layout */}
      {layout === "list" && (
        <div className="space-y-3 print:space-y-1">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex items-center gap-6 print:rounded-none print:border-gray-300 print:py-2 print:px-3 break-inside-avoid"
            >
              <canvas ref={setCanvasRef(tag.code)} />
              <div>
                <code className="font-mono font-bold text-lg text-gray-900 tracking-widest block">
                  {tag.code}
                </code>
                <p className="text-sm text-gray-500 mt-1">
                  {appUrl}/t/{tag.code}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">nomepierdo.com</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:grid-cols-4,
          .print\\:grid-cols-4 * {
            visibility: visible;
          }
          .print\\:space-y-1,
          .print\\:space-y-1 * {
            visibility: visible;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
