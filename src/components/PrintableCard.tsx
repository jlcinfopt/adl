import React from 'react';
import { Printer, X } from 'lucide-react';
import { RegistrationRecord } from '../types';
import { AdLeiriaLogo } from './AdLeiriaLogo';
import { printHtmlViaIframe } from '../utils/printHelper';

interface PrintableCardProps {
  record: RegistrationRecord;
  onClose: () => void;
}

export const PrintableCard: React.FC<PrintableCardProps> = ({ record, onClose }) => {
  const handlePrint = () => {
    const cardElement = document.getElementById('printable-card-content');
    if (cardElement) {
      printHtmlViaIframe(cardElement.innerHTML, `Ficha_AD_Leiria_${record.nome || 'Registo'}`);
    } else {
      window.print();
    }
  };

  // Convert string to character grid array (e.g. 12 cells)
  const formatLetterGrid = (str: string, totalCells = 12) => {
    const chars = (str || '').toUpperCase().split('');
    const grid: string[] = [];
    for (let i = 0; i < totalCells; i++) {
      grid.push(chars[i] || '');
    }
    return grid;
  };

  // Format date parts
  const dateParts = record.dataRegisto ? record.dataRegisto.split('-') : ['', '', ''];
  const formattedDay = dateParts[2] || '';
  const formattedMonth = dateParts[1] || '';
  const formattedYear = dateParts[0] || '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-6 border border-slate-300 animate-in fade-in zoom-in-95">
        {/* Modal Controls Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Visualização de Ficha Impressa (Réplica)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Sheet Replica Content */}
        <div id="printable-card-content" className="p-6 sm:p-8 bg-white text-slate-900 font-sans border-b border-slate-200">
          <div className="border-2 border-red-600 p-5 bg-white space-y-4 shadow-sm rounded-2xl">
            {/* Header: Logo & Ministry */}
            <div className="flex items-center justify-between border-b-2 border-red-600 pb-3">
              <AdLeiriaLogo size={38} showText={true} />
              <div className="text-right font-black text-xs uppercase tracking-wider text-red-600">
                MINISTÉRIO INTEGRARTE
              </div>
            </div>

            {/* Title & Decision Type */}
            <div className="text-center">
              <h1 className="text-lg font-black uppercase tracking-widest border-b-2 border-red-600 pb-1 mb-2 text-slate-900">
                FICHA DE REGISTO
              </h1>
              <div className="flex justify-center items-center gap-6 text-xs font-bold uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center font-black text-xs text-red-600">
                    {record.decisionType === 'VISITANTE' ? '✓' : ''}
                  </div>
                  <span>VISITANTE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center font-black text-xs text-red-600">
                    {record.decisionType === 'CONVERSAO' ? '✓' : ''}
                  </div>
                  <span>CONVERSÃO</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center font-black text-xs text-red-600">
                    {record.decisionType === 'RECONCILIACAO' ? '✓' : ''}
                  </div>
                  <span>RECONCILIAÇÃO</span>
                </div>
              </div>
            </div>

            {/* Boxed Grid Fields: Nome, Apelido, Telemovel */}
            <div className="border-2 border-red-600 text-xs rounded-xl overflow-hidden">
              {/* NOME ROW */}
              <div className="flex border-b border-red-600">
                <div className="w-32 font-bold p-2 bg-red-50 border-r border-red-600 uppercase tracking-wider text-slate-900 shrink-0">
                  NOME:
                </div>
                <div className="flex-1 flex overflow-x-auto">
                  {formatLetterGrid(record.nome, 12).map((char, i) => (
                    <div
                      key={i}
                      className="flex-1 h-8 border-r border-slate-300 last:border-r-0 flex items-center justify-center font-mono font-bold text-sm text-slate-900 bg-white"
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>

              {/* APELIDO ROW */}
              <div className="flex border-b border-red-600">
                <div className="w-32 font-bold p-2 bg-red-50 border-r border-red-600 uppercase tracking-wider text-[11px] text-slate-900 leading-tight shrink-0">
                  SOBRENOME:
                </div>
                <div className="flex-1 flex overflow-x-auto">
                  {formatLetterGrid(record.sobrenome, 12).map((char, i) => (
                    <div
                      key={i}
                      className="flex-1 h-8 border-r border-slate-300 last:border-r-0 flex items-center justify-center font-mono font-bold text-sm text-slate-900 bg-white"
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>

              {/* TELEMOVEL ROW */}
              <div className="flex">
                <div className="w-32 font-bold p-2 bg-red-50 border-r border-red-600 uppercase tracking-wider text-slate-900 shrink-0">
                  TELEMÓVEL:
                </div>
                <div className="flex-1 flex overflow-x-auto">
                  {formatLetterGrid(record.telemovel.replace(/\s+/g, ''), 12).map((char, i) => (
                    <div
                      key={i}
                      className="flex-1 h-8 border-r border-slate-300 last:border-r-0 flex items-center justify-center font-mono font-bold text-sm text-slate-900 bg-white"
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FAIXA ETARIA */}
            <div className="border border-slate-300 p-2.5 rounded-xl flex items-center justify-between text-xs bg-slate-50">
              <span className="font-bold uppercase text-slate-900">FAIXA ETÁRIA:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center font-bold text-[10px] text-red-600">
                    {record.faixaEtaria === '12 a 17 anos' ? '✓' : ''}
                  </div>
                  <span>12 a 17 anos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center font-bold text-[10px] text-red-600">
                    {record.faixaEtaria === '18 a 35 anos' ? '✓' : ''}
                  </div>
                  <span>18 a 35 anos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center font-bold text-[10px] text-red-600">
                    {record.faixaEtaria === '35 anos acima' ? '✓' : ''}
                  </div>
                  <span>35 anos acima</span>
                </div>
              </div>
            </div>

            {/* COMO CONHECEU A AD LEIRIA? */}
            <div className="border border-slate-300 p-3 rounded-xl space-y-1.5 text-xs bg-slate-50">
              <div className="font-bold uppercase text-slate-900">COMO CONHECEU A AD LEIRIA?</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-red-600">
                    {record.comoConheceu === 'Instagram' ? '✓' : ''}
                  </div>
                  <span>Instagram</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-red-600">
                    {record.comoConheceu === 'Evangelismo de rua' ? '✓' : ''}
                  </div>
                  <span>Evangelismo de rua</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-red-600">
                    {record.comoConheceu === 'Facebook' ? '✓' : ''}
                  </div>
                  <span>Facebook</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-red-600">
                    {record.comoConheceu === 'Por intermédio de alguém' ? '✓' : ''}
                  </div>
                  <span>Por intermédio de alguém</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-red-600">
                    {record.comoConheceu === 'Website' ? '✓' : ''}
                  </div>
                  <span>Website</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-red-600">
                    {record.comoConheceu === 'Outra (especifique)' ? '✓' : ''}
                  </div>
                  <span>Outra (especifique)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-red-600">
                    {record.comoConheceu === 'Google' ? '✓' : ''}
                  </div>
                  <span>Google</span>
                </div>
                {record.comoConheceuDetalhe && (
                  <div className="border-b border-dashed border-red-400 font-serif italic text-red-700 pl-1">
                    {record.comoConheceuDetalhe}
                  </div>
                )}
              </div>
            </div>

            {/* RGPD Consent */}
            <div className="border border-slate-300 p-2.5 rounded-xl flex items-start gap-2 text-[11px] text-slate-700 bg-slate-50">
              <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center font-bold text-[10px] text-red-600 shrink-0 mt-0.5">
                {record.autorizacaoRgpd ? '✓' : ''}
              </div>
              <p>
                Autorizo o tratamento dos meus dados pessoais para efeitos de registo e comunicação da igreja, nos termos do Regulamento Geral de Proteção de Dados (RGPD – Regulamento (UE) 2016/679).
              </p>
            </div>

            {/* Date & Celebration */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-300 p-2.5 rounded-xl flex items-center gap-2 bg-slate-50">
                <span className="font-bold uppercase text-slate-900">DATA:</span>
                <span className="font-mono font-bold text-sm text-red-600">
                  {formattedDay} / {formattedMonth} / {formattedYear}
                </span>
              </div>
              <div className="border border-slate-300 p-2.5 rounded-xl flex items-center justify-between bg-slate-50">
                <span className="font-bold uppercase text-slate-900">CELEBRAÇÃO DOMINGO:</span>
                <div className="flex items-center gap-3 font-semibold">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-red-600">
                      {record.celebracaoDomingo === '10h' ? '✓' : ''}
                    </div>
                    <span>10h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-red-600">
                      {record.celebracaoDomingo === '17h' ? '✓' : ''}
                    </div>
                    <span>17h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ASSINATURA */}
            <div className="border border-slate-300 p-2.5 rounded-xl flex items-center gap-3 text-xs bg-slate-50">
              <span className="font-bold uppercase text-slate-900">ASSINATURA:</span>
              <div className="flex-1 border-b border-slate-400 font-serif italic text-base text-red-700 px-2 min-h-7 flex items-center">
                {record.assinatura && record.assinatura.startsWith('data:image') ? (
                  <img src={record.assinatura} alt="Assinatura" className="h-6 object-contain" />
                ) : (
                  record.assinatura || `${record.nome} ${record.sobrenome}`
                )}
              </div>
            </div>

            {/* CHURCH PASTORAL FOLLOW-UP BOTTOM ROW */}
            <div className="border-t-2 border-red-600 pt-2 flex items-center justify-between text-xs bg-red-50 p-2.5 rounded-xl">
              <span className="font-bold uppercase text-[11px] text-red-800">
                A ser preenchido pela igreja:
              </span>
              <div className="flex items-center gap-4 font-bold text-slate-800">
                <div className="flex items-center gap-1">
                  <div className={`w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-xs ${record.acompanhamento.visita1 ? 'bg-red-600 text-white font-black' : 'bg-white'}`}>
                    {record.acompanhamento.visita1 ? '✓' : ''}
                  </div>
                  <span>1</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-xs ${record.acompanhamento.visita2 ? 'bg-red-600 text-white font-black' : 'bg-white'}`}>
                    {record.acompanhamento.visita2 ? '✓' : ''}
                  </div>
                  <span>2</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-xs ${record.acompanhamento.visita3 ? 'bg-red-600 text-white font-black' : 'bg-white'}`}>
                    {record.acompanhamento.visita3 ? '✓' : ''}
                  </div>
                  <span>3</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-4 h-4 border border-slate-700 rounded-sm flex items-center justify-center text-xs ${record.acompanhamento.visita4 ? 'bg-red-600 text-white font-black' : 'bg-white'}`}>
                    {record.acompanhamento.visita4 ? '✓' : ''}
                  </div>
                  <span>4</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="bg-slate-100 px-6 py-4 text-right no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
