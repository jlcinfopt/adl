import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  CheckCircle2, 
  Send, 
  Phone, 
  Mail, 
  User, 
  MessageSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AdLeiriaLogo } from './AdLeiriaLogo';
import { getStoredRecords, saveStoredRecord, recordMessageSentForPerson } from '../utils/storage';
import { RegistrationRecord, SentMessageLog } from '../types';
import { sendDirectWhatsAppMessage } from '../utils/directSender';

interface CoffeeConfirmationPublicFormProps {
  onBackToApp?: () => void;
}

export const CoffeeConfirmationPublicForm: React.FC<CoffeeConfirmationPublicFormProps> = ({
  onBackToApp,
}) => {
  const [nome, setNome] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [email, setEmail] = useState('');
  const [data, setData] = useState('2026-10-15');
  const [hora, setHora] = useState('08:00');
  const [local, setLocal] = useState('Gabinete Pastoral — AD Leiria');
  const [responsavel, setResponsavel] = useState('Pr. Bruno Malheiro / Equipa Pastoral');
  const [notas, setNotas] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [autoMessageSent, setAutoMessageSent] = useState(false);

  // Read URL query params if any
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pNome = params.get('nome');
    const pTel = params.get('telemovel');
    const pEmail = params.get('email');
    const pData = params.get('data');
    const pHora = params.get('hora');

    if (pNome) setNome(pNome);
    if (pTel) setTelemovel(pTel);
    if (pEmail) setEmail(pEmail);
    if (pData) setData(pData);
    if (pHora) setHora(pHora);
  }, []);

  const formatDatePT = (dStr: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  const formattedDate = formatDatePT(data);

  const confirmationMessageText = `✅ *Confirmação de Presença — Café com o Pastor* ☕\n\n` +
    `Olá ${nome || 'estimado(a) amigo(a)'}! A sua presença foi confirmada com sucesso.\n\n` +
    `📅 *Data:* ${formattedDate}\n` +
    `⏰ *Horário:* ${hora}\n` +
    `📍 *Local:* ${local}\n` +
    `👤 *Com:* ${responsavel}\n\n` +
    `Estamos muito felizes por este tempo de comunhão e oração pela sua vida!\n` +
    `_AD Leiria — Na família AD Leiria, nós celebramos, nós cuidamos e nós crescemos._`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telemovel.trim()) {
      alert('Por favor preencha o seu nome e número de telemóvel.');
      return;
    }

    setIsSending(true);

    // Find existing record or create new
    const records = getStoredRecords();
    const cleanPhone = telemovel.replace(/\D/g, '');
    let existing = records.find(
      (r) =>
        (cleanPhone && r.telemovel && r.telemovel.replace(/\D/g, '').includes(cleanPhone)) ||
        r.nome.toLowerCase().includes(nome.toLowerCase().trim())
    );

    let updatedRecord: RegistrationRecord;

    if (existing) {
      updatedRecord = {
        ...existing,
        acompanhamento: {
          ...existing.acompanhamento,
          cafeComPastor: true,
          dataCafeComPastor: data,
          horaCafeComPastor: hora,
          localCafeComPastor: local,
          responsavel,
          statusCafeComPastor: 'marcado',
          notasPastorais: notas ? `${existing.acompanhamento.notasPastorais || ''}\n[Formulário Café]: ${notas}`.trim() : existing.acompanhamento.notasPastorais,
          ultimaInteracao: new Date().toISOString().slice(0, 10),
        },
      };
    } else {
      updatedRecord = {
        id: 'rec-' + Date.now().toString(36),
        createdAt: new Date().toISOString(),
        decisionType: 'VISITANTE',
        visitType: '1a_visita',
        nome: nome.trim(),
        sobrenome: '',
        telemovel: telemovel.trim(),
        email: email.trim(),
        faixaEtaria: '18 a 35 anos',
        comoConheceu: 'Por intermédio de alguém',
        autorizacaoRgpd: true,
        dataRegisto: new Date().toISOString().slice(0, 10),
        celebracaoDomingo: '10h',
        acompanhamento: {
          visita1: false,
          visita2: false,
          visita3: false,
          visita4: false,
          cafeComPastor: true,
          dataCafeComPastor: data,
          horaCafeComPastor: hora,
          localCafeComPastor: local,
          responsavel,
          statusCafeComPastor: 'marcado',
          notasPastorais: notas ? `[Formulário Café]: ${notas}` : '',
          ultimaInteracao: new Date().toISOString().slice(0, 10),
        },
      };
    }

    saveStoredRecord(updatedRecord);

    // Try direct WhatsApp send to send automatic confirmation message
    try {
      const res = await sendDirectWhatsAppMessage(
        telemovel,
        confirmationMessageText,
        undefined,
        nome
      );
      if (res.success) {
        setAutoMessageSent(true);
        const logPayload: SentMessageLog = {
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          tipo: 'whatsapp',
          versiculoRef: 'Confirmação Café com Pastor (Formulário)',
          conteudo: confirmationMessageText,
          dataEnvio: new Date().toISOString(),
          status: 'enviado',
          destinatarioNome: nome,
          destinatarioContacto: telemovel,
        };
        recordMessageSentForPerson(updatedRecord.id, logPayload);
      }
    } catch (err) {
      console.warn('Auto WhatsApp notification notice:', err);
    }

    setIsSending(false);
    setSubmitted(true);
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Olá! Confirmei a minha presença no Café com o Pastor na AD Leiria:\n\n📅 Data: ${formattedDate}\n⏰ Horário: ${hora}\n📍 Local: ${local}\n👤 Com: ${responsavel}`
  )}`;

  return (
    <div className="min-h-screen bg-slate-900/90 py-8 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200/50">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-red-800 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex justify-center">
              <AdLeiriaLogo size={56} showText={false} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-200 border border-amber-300/30 rounded-full text-xs font-black uppercase tracking-widest">
              <Coffee className="w-3.5 h-3.5 text-amber-300" />
              Igreja Evangélica AD Leiria
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Formulário: Café com o Pastor ☕
            </h1>
            <p className="text-amber-100/90 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-medium">
              Um momento simples e especial para conhecer melhor a visão da igreja, partilhar e criar vínculos.
            </p>
          </div>
        </div>

        {/* Body Form / Success Screen */}
        <div className="p-6 sm:p-8 space-y-6">
          {submitted ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="bg-emerald-50 border-2 border-emerald-500/80 rounded-2xl p-6 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-black text-emerald-950">
                  Presença Confirmada com Sucesso! 🎉
                </h3>
                <p className="text-xs text-emerald-800 font-medium">
                  A sua confirmação foi registada no sistema da igreja. Esperamos por si!
                </p>
              </div>

              {/* Automatic Confirmation Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-amber-200 pb-3">
                  <Coffee className="w-5 h-5 text-amber-700" />
                  <h4 className="font-black text-sm uppercase tracking-wider text-amber-950">
                    Detalhes do Seu Café com o Pastor
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Data</span>
                    <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Horário</span>
                    <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      {hora}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Local</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                      {local}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Com Quem</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      {responsavel}
                    </span>
                  </div>
                </div>

                {autoMessageSent && (
                  <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Enviámos uma mensagem de confirmação automática por WhatsApp para o seu telemóvel!</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Confirmação para o WhatsApp da Igreja</span>
                </a>

                {onBackToApp && (
                  <button
                    type="button"
                    onClick={onBackToApp}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Voltar ao Painel da Igreja
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl text-xs text-amber-900 font-medium">
                Por favor preencha os seus dados abaixo para confirmar a sua presença no <strong>Café com o Pastor</strong>.
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Telemóvel */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Número de Telemóvel / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={telemovel}
                    onChange={(e) => setTelemovel(e.target.value)}
                    placeholder="Ex: 912 345 678"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  E-mail (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: joao@exemplo.pt"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data Pretendida *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Horário Pretendido *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      required
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Observação / Mensagem opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pedido de Oração ou Algum Recado (Opcional)
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Se desejar partilhar algum assunto ou pedido de oração..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>A Aregistar Confirmação...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar a Minha Presença no Café ☕</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
