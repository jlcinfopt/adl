import React, { useState } from 'react';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  UserCheck, 
  Clock,
  Calendar,
  ExternalLink,
  RotateCcw,
  FileText
} from 'lucide-react';
import { RegistrationRecord, SentMessageLog, PastoralFollowUp, BibleVerse } from '../types';
import { 
  formatWhatsAppUrl, 
  formatGmailComposeUrl, 
  formatMailtoUrl,
  recordMessageSentForPerson,
  saveStoredRecord,
  getStoredVerses,
  replacePlaceholders
} from '../utils/storage';
import { INITIAL_VERSES } from '../data/initialData';
import { sendDirectWhatsAppMessage, sendDirectEmailMessage, getDirectGatewayConfig } from '../utils/directSender';

interface SendFollowUpStepModalProps {
  record: RegistrationRecord;
  stage: keyof PastoralFollowUp;
  stageIndex: number; // 0 to 3 for steps 1 to 4
  existingLog?: SentMessageLog;
  onClose: () => void;
  onSuccess: () => void;
}

const STEP_TITLES = [
  'Passo 1: 1. Acolhimento - Boas-Vindas à AD Leiria',
  'Passo 2: 2. Cuidado e Encorajamento - Semana Abençoada',
  'Passo 3: 3. Convite para Regressar - Próximas Celebrações',
  'Passo 4: 4. Convite ao Café com o Pastor - Inscrição & Confirmação',
];

export function getStepDefaultMessage(stageIndex: number, person: RegistrationRecord): string {
  const verses = getStoredVerses();
  const ids = ['msg-1-acolhimento', 'msg-2-cuidado', 'msg-3-regressar', 'msg-4-cafe'];
  const targetId = ids[stageIndex];

  let foundVerse: BibleVerse | undefined = verses.find((v) => v.id === targetId);
  if (!foundVerse) {
    const cats = [
      '1 Acolhimento',
      '2 Cuidado e Encorajamento',
      '3 Convite para Regressar',
      '4 Convite ao Café com o Pastor',
    ];
    foundVerse = verses.find((v) => v.categoria && v.categoria.includes(cats[stageIndex].slice(2)));
  }
  if (!foundVerse) {
    foundVerse = INITIAL_VERSES[stageIndex];
  }

  const rawTemplate = foundVerse?.texto || INITIAL_VERSES[stageIndex]?.texto || '';
  return replacePlaceholders(rawTemplate, person, foundVerse?.referencia, foundVerse?.texto);
}

export const SendFollowUpStepModal: React.FC<SendFollowUpStepModalProps> = ({
  record,
  stage,
  stageIndex,
  existingLog,
  onClose,
  onSuccess,
}) => {
  const isDone = Boolean(record.acompanhamento[stage]);
  const defaultText = getStepDefaultMessage(stageIndex, record);
  const [messageContent, setMessageContent] = useState(defaultText);
  const [contactNote, setContactNote] = useState('');
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'presencial'>('whatsapp');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const gatewayConfig = getDirectGatewayConfig();
  const hasDirectWhatsApp = Boolean(gatewayConfig.whatsappEnabled && (gatewayConfig.whatsappApiToken || gatewayConfig.whatsappGatewayUrl));
  const hasDirectEmail = Boolean(gatewayConfig.emailEnabled && gatewayConfig.emailApiKey);

  // Send via WhatsApp
  const handleSendWhatsApp = async (useDirect = false) => {
    setIsSending(true);
    setFeedback(null);

    const logPayload: SentMessageLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      tipo: 'whatsapp',
      versiculoRef: `Passo ${stageIndex + 1} de Acompanhamento`,
      conteudo: messageContent,
      dataEnvio: new Date().toISOString(),
      status: 'enviado',
      destinatarioNome: `${record.nome} ${record.sobrenome}`.trim(),
      destinatarioContacto: record.telemovel || '',
    };

    if (useDirect && hasDirectWhatsApp) {
      const res = await sendDirectWhatsAppMessage(
        record.telemovel,
        messageContent,
        undefined,
        `${record.nome} ${record.sobrenome}`.trim()
      );
      if (!res.success) {
        setIsSending(false);
        setFeedback(`Falha no envio direto: ${res.error}. Pode usar o WhatsApp Web.`);
        return;
      }
    } else {
      // Open WhatsApp Web/Mobile
      const url = formatWhatsAppUrl(record.telemovel, messageContent);
      window.open(url, '_blank');
    }

    // Save and automatically mark step
    recordMessageSentForPerson(record.id, logPayload);
    setIsSending(false);
    setFeedback(`✓ Mensagem enviada e Passo ${stageIndex + 1} preenchido automaticamente com sucesso!`);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1200);
  };

  // Send via Email
  const handleSendEmail = async (useDirect = false) => {
    setIsSending(true);
    setFeedback(null);

    const subject = `Acolhimento AD Leiria • ${STEP_TITLES[stageIndex]}`;
    const logPayload: SentMessageLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      tipo: 'email',
      versiculoRef: `Passo ${stageIndex + 1} de Acompanhamento`,
      conteudo: messageContent,
      dataEnvio: new Date().toISOString(),
      status: 'enviado',
      destinatarioNome: `${record.nome} ${record.sobrenome}`.trim(),
      destinatarioContacto: record.email || '',
    };

    if (useDirect && hasDirectEmail) {
      const res = await sendDirectEmailMessage(record.email, subject, messageContent);
      if (!res.success) {
        setIsSending(false);
        setFeedback(`Falha no envio direto: ${res.error}. Pode usar o cliente de e-mail.`);
        return;
      }
    } else {
      const url = formatGmailComposeUrl(record.email, subject, messageContent);
      window.open(url, '_blank');
    }

    // Save and automatically mark step
    recordMessageSentForPerson(record.id, logPayload);
    setIsSending(false);
    setFeedback(`✓ E-mail enviado e Passo ${stageIndex + 1} preenchido automaticamente com sucesso!`);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1200);
  };

  // Register Presential / Phone Contact
  const handleRegisterPresential = () => {
    if (!contactNote.trim()) {
      alert('Por favor insira uma breve nota descrevendo o contacto presencial ou chamada telefónica.');
      return;
    }

    setIsSending(true);
    const logPayload: SentMessageLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      tipo: 'whatsapp',
      versiculoRef: `Contacto Presencial/Telefónico • Passo ${stageIndex + 1}`,
      conteudo: `[Contacto Registado]: ${contactNote.trim()}`,
      dataEnvio: new Date().toISOString(),
      status: 'enviado',
      destinatarioNome: `${record.nome} ${record.sobrenome}`.trim(),
      destinatarioContacto: record.telemovel || record.email || 'Presencial',
    };

    recordMessageSentForPerson(record.id, logPayload);
    setIsSending(false);
    setFeedback(`✓ Contacto registado e Passo ${stageIndex + 1} preenchido com sucesso!`);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1200);
  };

  // Unmark step (only allowed if confirmed)
  const handleUnmarkStep = () => {
    if (confirm(`Tem a certeza que deseja desmarcar o Passo ${stageIndex + 1} para ${record.nome}?`)) {
      const updatedRecord: RegistrationRecord = {
        ...record,
        acompanhamento: {
          ...record.acompanhamento,
          [stage]: false,
          cafeComPastor: false, // If unmarking a step, cafe is revoked
        },
      };
      saveStoredRecord(updatedRecord);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-6 border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="bg-red-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-800 text-[10px] font-black uppercase tracking-wider mb-1">
                {STEP_TITLES[stageIndex]}
              </div>
              <h3 className="font-black text-lg text-white">
                {record.nome} {record.sobrenome}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              isDone
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {isDone
                  ? `Este passo já foi preenchido automaticamente através de envio de mensagem anterior.`
                  : `Este campo é preenchido automaticamente conforme o envio de mensagem. Não pode ser marcado se não for enviada mensagem.`}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {isDone
                  ? 'Pode enviar uma nova mensagem de reforço ou consultar o histórico abaixo.'
                  : 'Selecione abaixo o canal (WhatsApp, E-mail ou Contacto Presencial) para realizar o envio e preencher o passo.'}
              </p>
            </div>
          </div>

          {/* Channels tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>E-mail</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presencial')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'presencial'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Chamada / Presencial</span>
            </button>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {/* WhatsApp / Email message editor */}
          {activeTab !== 'presencial' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700 truncate mr-2">
                  {STEP_TITLES[stageIndex]}:
                </span>
                <button
                  type="button"
                  onClick={() => setMessageContent(getStepDefaultMessage(stageIndex, record))}
                  className="text-[11px] text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer shrink-0"
                  title="Restaurar o texto oficial da mensagem configurada"
                >
                  Restaurar Texto Oficial
                </button>
              </div>
              <textarea
                rows={6}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-red-500 font-sans leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {activeTab === 'whatsapp' ? (
                  <>
                    <button
                      type="button"
                      disabled={isSending || !record.telemovel}
                      onClick={() => handleSendWhatsApp(false)}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Abrir WhatsApp Web & Marcar Passo</span>
                    </button>
                    {hasDirectWhatsApp && (
                      <button
                        type="button"
                        disabled={isSending || !record.telemovel}
                        onClick={() => handleSendWhatsApp(true)}
                        className="py-2.5 px-3 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Enviar diretamente em segundo plano sem abrir o WhatsApp Web"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Envio Direto</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isSending || !record.email}
                      onClick={() => handleSendEmail(false)}
                      className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Abrir E-mail & Marcar Passo</span>
                    </button>
                    {hasDirectEmail && (
                      <button
                        type="button"
                        disabled={isSending || !record.email}
                        onClick={() => handleSendEmail(true)}
                        className="py-2.5 px-3 bg-red-50 text-red-800 border border-red-300 hover:bg-red-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Enviar diretamente em segundo plano via Resend API"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Envio Direto</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Presential / Phone registration */
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Caso o contacto de acolhimento tenha sido realizado pessoalmente no culto ou através de chamada telefónica direta, registre uma breve nota para validar e preencher o passo com transparência.
              </p>
              <textarea
                rows={4}
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                placeholder="Ex.: Conversa presencial ao final do culto das 17h com o Pr. Carlos. Muito recetivo(a), orámos pela família e convidámos para o grupo de acolhimento."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                disabled={isSending || !contactNote.trim()}
                onClick={handleRegisterPresential}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registar Contacto Realizado & Preencher Passo</span>
              </button>
            </div>
          )}

          {/* Unmark option if already done */}
          {isDone && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Foi preenchido por engano?
              </span>
              <button
                type="button"
                onClick={handleUnmarkStep}
                className="text-xs text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
              >
                Desmarcar este passo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
