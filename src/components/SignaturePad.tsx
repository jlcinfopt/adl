import React, { useRef, useState, useEffect } from 'react';
import { Eraser, PenTool, Type, Check } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange, required }) => {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(value && !value.startsWith('data:image') ? value : '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#dc2626'; // red ink matching AD Leiria branding
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onChange('');
  };

  const handleTypedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedName(val);
    onChange(val);
  };

  return (
    <div className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'draw'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Desenhar Rubrica / Assinatura
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'type'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Digitar Nome
          </button>
        </div>

        {mode === 'draw' && hasDrawn && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {mode === 'draw' ? (
        <div className="relative border-2 border-dashed border-slate-300 bg-white rounded-lg overflow-hidden touch-none">
          <canvas
            ref={canvasRef}
            width={480}
            height={130}
            className="w-full h-32 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasDrawn && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs italic">
              Desenhe a sua assinatura ou rubrica aqui com o dedo ou rato
            </div>
          )}
          <div className="absolute bottom-2 left-4 right-4 border-b border-slate-200 pointer-events-none" />
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={typedName}
            onChange={handleTypedChange}
            placeholder="Digite o seu nome completo para assinar..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          {typedName && (
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-center font-serif italic text-lg text-red-600 tracking-wider">
              {typedName}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
