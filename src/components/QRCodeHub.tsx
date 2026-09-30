import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  ExternalLink, 
  Sparkles, 
  MessageCircle,
  Share2
} from 'lucide-react';
import { AdLeiriaLogo } from './AdLeiriaLogo';
import { printHtmlViaIframe } from '../utils/printHelper';

interface QRCodeHubProps {
  onOpenFormDirectly?: () => void;
}

export const QRCodeHub: React.FC<QRCodeHubProps> = ({ onOpenFormDirectly }) => {
  const [formUrl, setFormUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPosterMode, setIsPosterMode] = useState(false);

  // Compute public shared URL
  const computePublicUrl = () => {
    let origin = window.location.origin;
    // Replace private dev url with public shared url so any phone scanning QR code can access without error
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    const base = origin + window.location.pathname;
    return `${base}?view=form`;
  };

  const generateQRCodeForUrl = (targetUrl: string) => {
    QRCode.toDataURL(targetUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: '#DC2626', // official red
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code', err);
      });
  };

  useEffect(() => {
    const cleanUrl = computePublicUrl();
    setFormUrl(cleanUrl);
    generateQRCodeForUrl(cleanUrl);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'AD_Leiria_QRCode_Ficha_Registo.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareWhatsApp = () => {
    const text = `Graça e Paz! Seja muito bem-vindo(a) à AD Leiria. Para preencher a sua Ficha de Registo de Visitantes Ad-Leiria, clique no link abaixo:\n\n${formUrl}\n\nDeus te abençoe! 🙏`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrintPoster = () => {
    const posterHtml = `
      <div style="text-align: center; padding: 20px; border: 4px solid #dc2626; border-radius: 20px; max-width: 600px; margin: 0 auto;">
        <div style="font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">
          Igreja Evangélica Assembleia de Deus em Leiria • Ministério Integrarte
        </div>
        <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 8px 0;">
          Seja Bem-vindo(a) à Nossa Casa! ✨
        </h1>
        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          Aponte a câmara do seu telemóvel para o código abaixo e preencha a sua <strong>Ficha de Registo</strong> em menos de 1 minuto.
        </p>
        <div style="padding: 16px; border: 3px solid #dc2626; border-radius: 16px; display: inline-block; background: #fff; margin-bottom: 16px;">
          <img src="${qrDataUrl}" alt="QR Code" style="width: 260px; height: 260px; display: block;" />
        </div>
        <div style="font-size: 13px; font-weight: bold; color: #dc2626; font-family: monospace; margin-bottom: 6px;">
          ${formUrl}
        </div>
        <div style="font-size: 12px; color: #64748b; font-weight: 600;">
          Celebrações aos Domingos: 10h00 e 17h00 • Leiria
        </div>
      </div>
    `;
    printHtmlViaIframe(posterHtml, 'Cartaz_A4_AD_Leiria_QRCode');
  };

  return (
    <div className="space-y-6">
      {/* Header & Explanatory Card */}
      <div className="bg-white border-2 border-red-600 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-50 rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <QrCode className="w-3.5 h-3.5" />
            Acesso Digital & Divulgação
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2">
            QR Code & Partilha do Formulário
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Os visitantes podem apontar a câmara do telemóvel para o QR Code nos ecrãs da igreja, balcão de acolhimento ou folhetos. Também pode partilhar o link direto via WhatsApp, redes sociais ou e-mail.
          </p>
        </div>
      </div>

      {/* Main Grid: QR Card + Link Sharing Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code Display Card */}
        <div className="lg:col-span-5 bg-white border border-red-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
          <div className="w-full bg-white border border-red-200 rounded-2xl p-3 mb-5 flex items-center justify-between shadow-2xs">
            <AdLeiriaLogo size={32} showText={true} />
            <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Oficial
            </span>
          </div>

          {/* QR Box with red decorative frame */}
          <div className="p-4 bg-white border-2 border-red-600 rounded-3xl shadow-md mb-4 relative group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Ficha de Registo AD Leiria"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl"
              />
            ) : (
              <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center bg-red-50 rounded-2xl text-red-400 text-xs">
                A carregar QR Code...
              </div>
            )}
          </div>

          <div className="space-y-1 mb-6">
            <h3 className="font-extrabold text-slate-900 text-base">Escaneie com a câmara</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Abre instantaneamente o formulário digital de 1ª visita
            </p>
          </div>

          {/* QR Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar QR (PNG)
            </button>

            <button
              type="button"
              onClick={() => setIsPosterMode(!isPosterMode)}
              className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              {isPosterMode ? 'Fechar Cartaz' : 'Modo Cartaz A4'}
            </button>
          </div>
        </div>

        {/* Right Column: Link Sharing, Copy & WhatsApp */}
        <div className="lg:col-span-7 space-y-5">
          {/* Direct Link Card */}
          <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Link Direto do Formulário</h3>
                  <p className="text-xs text-slate-500">Envie por SMS, WhatsApp, Bio do Instagram ou E-mail</p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Link Público para Visitantes
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2">
              <input
                type="text"
                readOnly
                value={formUrl}
                className="w-full bg-transparent px-3 text-xs font-mono text-slate-800 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Link
                  </>
                )}
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Partilhar no WhatsApp
              </button>

              {onOpenFormDirectly && (
                <button
                  type="button"
                  onClick={onOpenFormDirectly}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-red-400" />
                  Testar / Abrir Formulário
                </button>
              )}
            </div>
          </div>

          {/* Information & Best Practices Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-600" /> Dicas de Utilização nos Cultos
            </h4>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
                <span><strong>Projeção no Ecrã Principal:</strong> Mostre o QR Code durante o momento de avisos e boas-vindas aos visitantes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
                <span><strong>Balcão de Boas-Vindas:</strong> Imprima o cartaz A4 e coloque no espaço do Ministério Integrarte.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
                <span><strong>Acompanhamento Automático:</strong> Assim que a pessoa preencher, os contactos ficam imediatamente disponíveis no painel de registos para agendamento de versículos bíblicos.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Printable Poster Preview Modal */}
      {isPosterMode && (
        <div className="bg-white border-4 border-red-600 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 max-w-xl mx-auto text-center animate-in fade-in zoom-in-95">
          <div className="border-b-2 border-red-600 pb-5">
            <div className="flex justify-center mb-2">
              <AdLeiriaLogo size={64} showText={true} />
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
              IGREJA EVANGÉLICA • MINISTÉRIO INTEGRARTE
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">
              Seja Bem-vindo(a) à Nossa Casa! ✨
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Aponte a câmara do seu telemóvel para o código abaixo e preencha a sua <strong>Ficha de Registo</strong> em menos de 1 minuto.
            </p>
          </div>

          <div className="p-6 bg-white border-4 border-red-600 rounded-3xl inline-block shadow-lg my-2">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR Code Poster"
                className="w-64 h-64 mx-auto object-contain"
              />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono font-bold text-red-600">{formUrl}</p>
            <p className="text-xs text-slate-500 font-semibold">
              Celebrações aos Domingos: 10h00 e 17h00
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handlePrintPoster}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Agora (Ctrl+P)
            </button>
            <button
              type="button"
              onClick={() => setIsPosterMode(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
