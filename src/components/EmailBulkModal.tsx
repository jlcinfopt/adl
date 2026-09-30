import React, { useState } from 'react';
import { 
  Mail, 
  ExternalLink, 
  X, 
  Copy, 
  Check, 
  Send, 
  Users,
  AlertCircle,
  Zap,
  Settings,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { RegistrationRecord, BibleVerse } from '../types';
import { 
  formatMailtoUrl, 
  formatGmailComposeUrl, 
  formatOutlookComposeUrl, 
  replacePlaceholders, 
  addSentLog,
  recordMessageSentForPerson
} from '../utils/storage';
import { 
  sendDirectEmailMessage, 
  getDirectGatewayConfig 
} from '../utils/directSender';
import { DirectGatewayModal } from './DirectGatewayModal';

interface EmailBulkModalProps {
  recipients: RegistrationRecord[];
  verse: BibleVerse;
  messageTemplate: string;
  onClose: () => void;
  onFinished?: () => void;
}

export const EmailBulkModal: React.FC<EmailBulkModalProps> = ({
  recipients,
  verse,
  messageTemplate,
  onClose,
  onFinished,
}) => {
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBcc, setCopiedBcc] = useState(false);

  // Mode: direct (background API) vs assisted (webmail)
  const [dispatchMode, setDispatchMode] = useState<'direct' | 'assisted'>('direct');
  const [isSendingDirectBatch, setIsSendingDirectBatch] = useState(false);
  const [directCurrentName, setDirectCurrentName] = useState<string | null>(null);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [directNotification, setDirectNotification] = useState<string | null>(null);
  const [gatewayConfig, setGatewayConfig] = useState(() => getDirectGatewayConfig());
  const isGatewayReady = Boolean(gatewayConfig.resendApiKey && gatewayConfig.resendFromEmail);

  // Filter recipients with valid emails
  const validRecipients = recipients.filter((r) => r.email && r.email.includes('@'));
  const noEmailRecipients = recipients.filter((r) => !r.email || !r.email.includes('@'));

  const emailSubject = `Palavra de Edificação: ${verse.referencia} • AD Leiria - Integrarte`;

  // Direct Send Single
  const handleSendSingleDirect = async (rec: RegistrationRecord) => {
    const formattedMsg = replacePlaceholders(
      messageTemplate,
      rec,
      verse.referencia,
      verse.texto,
      verse.reflexaoBreve
    );

    const res = await sendDirectEmailMessage(rec.email, emailSubject, formattedMsg);

    if (res.success) {
      setSentMap((prev) => ({ ...prev, [rec.id]: true }));
      setErrorMap((prev) => {
        const next = { ...prev };
        delete next[rec.id];
        return next;
      });

      recordMessageSentForPerson(rec.id, {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        tipo: 'email',
        versiculoRef: verse.referencia,
        conteudo: formattedMsg,
        dataEnvio: new Date().toISOString(),
        status: 'enviado',
        destinatarioNome: `${rec.nome} ${rec.sobrenome}`.trim(),
        destinatarioContacto: rec.email,
      });

      setDirectNotification(`E-mail para ${rec.nome} enviado diretamente em segundo plano!`);
      setTimeout(() => setDirectNotification(null), 3000);
    } else {
      setErrorMap((prev) => ({ ...prev, [rec.id]: res.error || 'Erro ao enviar e-mail' }));
    }
  };

  // Direct Batch Send
  const handleStartDirectBatch = async () => {
    if (isSendingDirectBatch) return;
    setIsSendingDirectBatch(true);
    setDirectNotification('A iniciar envio direto de e-mails em segundo plano...');

    const pending = validRecipients.filter((r) => !sentMap[r.id]);
    if (pending.length === 0) {
      setDirectNotification('Todos os e-mails elegíveis já foram enviados!');
      setIsSendingDirectBatch(false);
      return;
    }

    let count = 0;
    for (let i = 0; i < pending.length; i++) {
      const rec = pending[i];
      setDirectCurrentName(`${rec.nome} ${rec.sobrenome} (${i + 1}/${pending.length})`);

      const formattedMsg = replacePlaceholders(
        messageTemplate,
        rec,
        verse.referencia,
        verse.texto,
        verse.reflexaoBreve
      );

      const res = await sendDirectEmailMessage(rec.email, emailSubject, formattedMsg);

      if (res.success) {
        count++;
        setSentMap((prev) => ({ ...prev, [rec.id]: true }));
        recordMessageSentForPerson(rec.id, {
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          tipo: 'email',
          versiculoRef: verse.referencia,
          conteudo: formattedMsg,
          dataEnvio: new Date().toISOString(),
          status: 'enviado',
          destinatarioNome: `${rec.nome} ${rec.sobrenome}`.trim(),
          destinatarioContacto: rec.email,
        });
      } else {
        setErrorMap((prev) => ({ ...prev, [rec.id]: res.error || 'Erro no envio' }));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setDirectCurrentName(null);
    setIsSendingDirectBatch(false);
    setDirectNotification(`✓ Concluído! ${count} e-mails enviados diretamente em segundo plano sem abrir o programa de correio.`);
  };

  const handleOpenEmail = (
    rec: RegistrationRecord, 
    provider: 'gmail' | 'outlook' | 'mailto'
  ) => {
    const formattedMsg = replacePlaceholders(
      messageTemplate,
      rec,
      verse.referencia,
      verse.texto,
      verse.reflexaoBreve
    );

    let url = '';
    if (provider === 'gmail') {
      url = formatGmailComposeUrl(rec.email, emailSubject, formattedMsg);
    } else if (provider === 'outlook') {
      url = formatOutlookComposeUrl(rec.email, emailSubject, formattedMsg);
    } else {
      url = formatMailtoUrl(rec.email, emailSubject, formattedMsg);
    }

    // Open compose window
    if (provider === 'mailto') {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }

    // Mark as sent
    setSentMap((prev) => ({ ...prev, [rec.id]: true }));

    // Add log and advance follow-up automatically
    recordMessageSentForPerson(rec.id, {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      tipo: 'email',
      versiculoRef: verse.referencia,
      conteudo: formattedMsg,
      dataEnvio: new Date().toISOString(),
      status: 'enviado',
      destinatarioNome: `${rec.nome} ${rec.sobrenome}`.trim(),
      destinatarioContacto: rec.email,
    });

    if (currentIndex < validRecipients.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSendBatchBcc = (provider: 'gmail' | 'outlook') => {
    const allEmails = validRecipients.map((r) => r.email).join(',');
    const genericMsg = replacePlaceholders(
      messageTemplate,
      { nome: 'Amado(a) Irmão(ã)', sobrenome: '' } as unknown as RegistrationRecord,
      verse.referencia,
      verse.texto,
      verse.reflexaoBreve
    );

    let url = '';
    if (provider === 'gmail') {
      url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(allEmails)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(genericMsg)}`;
    } else {
      url = `https://outlook.live.com/mail/0/deeplink/compose?bcc=${encodeURIComponent(allEmails)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(genericMsg)}`;
    }

    window.open(url, '_blank');

    const newMap: Record<string, boolean> = {};
    validRecipients.forEach((r) => {
      newMap[r.id] = true;
      addSentLog({
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        tipo: 'email',
        versiculoRef: verse.referencia,
        conteudo: genericMsg,
        dataEnvio: new Date().toISOString(),
        status: 'enviado',
        destinatarioNome: `${r.nome} ${r.sobrenome}`.trim(),
        destinatarioContacto: r.email,
      });
    });
    setSentMap(newMap);
  };

  const handleCopyAllEmailsBcc = () => {
    const list = validRecipients.map((r) => r.email).join(', ');
    navigator.clipboard.writeText(list);
    setCopiedBcc(true);
    setTimeout(() => setCopiedBcc(false), 2000);
  };

  const handleCopyMessage = (rec: RegistrationRecord) => {
    const formattedMsg = replacePlaceholders(
      messageTemplate,
      rec,
      verse.referencia,
      verse.texto,
      verse.reflexaoBreve
    );
    navigator.clipboard.writeText(formattedMsg);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkAllSent = () => {
    const newMap: Record<string, boolean> = {};
    validRecipients.forEach((r) => {
      newMap[r.id] = true;
      addSentLog({
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        tipo: 'email',
        versiculoRef: verse.referencia,
        conteudo: replacePlaceholders(messageTemplate, r, verse.referencia, verse.texto, verse.reflexaoBreve),
        dataEnvio: new Date().toISOString(),
        status: 'enviado',
        destinatarioNome: `${r.nome} ${r.sobrenome}`.trim(),
        destinatarioContacto: r.email,
      });
    });
    setSentMap(newMap);
  };

  const sentCount = Object.values(sentMap).filter(Boolean).length;
  const progressPercent = Math.round((sentCount / Math.max(validRecipients.length, 1)) * 100);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-red-700 text-white p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                  Disparo de Mensagens por E-mail
                  <span className="text-[10px] bg-red-900/80 text-red-200 px-2 py-0.5 rounded-full font-bold uppercase">
                    {dispatchMode === 'direct' ? 'Direto em 2º Plano' : 'Assistido (Gmail / Outlook)'}
                  </span>
                </h3>
                <p className="text-xs text-red-100 font-medium">
                  Versículo: <span className="font-bold text-white">{verse.referencia}</span> • {validRecipients.length} com e-mail válido
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsGatewayModalOpen(true)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Configurações da API de E-mail"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Banner */}
          <div className="bg-red-50/70 border-b border-red-100 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-950">Modo de Envio:</span>
              <div className="flex bg-white rounded-xl p-1 border border-red-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDispatchMode('direct')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    dispatchMode === 'direct'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  Envio Direto (Sem abrir clientes)
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchMode('assisted')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    dispatchMode === 'assisted'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Gmail / Outlook
                </button>
              </div>
            </div>

            {dispatchMode === 'direct' ? (
              <button
                type="button"
                disabled={isSendingDirectBatch || sentCount === validRecipients.length}
                onClick={handleStartDirectBatch}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all ${
                  isSendingDirectBatch
                    ? 'bg-amber-500 text-white animate-pulse'
                    : sentCount === validRecipients.length
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                }`}
              >
                {isSendingDirectBatch ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>A enviar em 2º plano...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Enviar Todos os E-mails Diretamente ({validRecipients.length - sentCount})</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendBatchBcc('gmail')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Abrir no Gmail com todos os e-mails em Cco"
                >
                  <span>Gmail Coletivo (Cco)</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSendBatchBcc('outlook')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Abrir no Outlook com todos os e-mails em Cco"
                >
                  <span>Outlook (Cco)</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Direct Sending Live Status / Notification */}
          {(directNotification || directCurrentName) && (
            <div className="bg-red-800 text-white px-4 py-2 text-xs flex items-center justify-between animate-fade-in font-medium">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                {directCurrentName ? `A enviar: ${directCurrentName}` : directNotification}
              </span>
              {directNotification && (
                <button
                  type="button"
                  onClick={() => setDirectNotification(null)}
                  className="text-red-200 hover:text-white font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Progress Bar & Mark All */}
          <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span>Progresso dos E-mails:</span>
              <span className="font-black text-sm text-red-600">
                {sentCount} de {validRecipients.length} ({progressPercent}%)
              </span>
            </div>
            <button
              type="button"
              onClick={handleMarkAllSent}
              className="text-xs text-red-700 hover:text-red-900 font-bold underline cursor-pointer"
            >
              Marcar todos como enviados
            </button>
          </div>

          <div className="w-full bg-slate-200 h-1.5 shrink-0">
            <div
              className="bg-red-600 h-1.5 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Recipients List & Interactive Dispatch */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {noEmailRecipients.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-800 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {noEmailRecipients.length} contacto(s) sem e-mail registado foram ignorados automaticamente.
                </span>
              </div>
            )}

            {validRecipients.map((rec, index) => {
              const isSent = Boolean(sentMap[rec.id]);
              const hasError = errorMap[rec.id];
              const isCurrent = index === currentIndex;

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSent
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : hasError
                      ? 'bg-rose-50 border-rose-200'
                      : isCurrent
                      ? 'bg-red-50/50 border-red-300 ring-2 ring-red-100'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isSent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {isSent ? '✓' : index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {rec.nome} {rec.sobrenome}
                          </span>
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                            {rec.decisionType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {rec.email}
                        </div>
                        {hasError && (
                          <div className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {hasError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(rec)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copiar texto do e-mail"
                      >
                        {copiedId === rec.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === rec.id ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      {dispatchMode === 'direct' ? (
                        <button
                          type="button"
                          disabled={!rec.email || isSendingDirectBatch}
                          onClick={() => handleSendSingleDirect(rec)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>{isSent ? 'Reenviar Direto' : 'Enviar Direto'}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEmail(rec, 'gmail')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            title="Abrir no Gmail"
                          >
                            <span>Gmail</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEmail(rec, 'outlook')}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            title="Abrir no Outlook"
                          >
                            <span>Outlook</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-slate-700">{sentCount}</span> de {validRecipients.length} enviados
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setIsGatewayModalOpen(true)}
                className="text-red-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" /> Configurar API de E-mail
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onFinished) onFinished();
                onClose();
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>

      {/* Gateway Configuration Modal */}
      <DirectGatewayModal
        isOpen={isGatewayModalOpen}
        onClose={() => setIsGatewayModalOpen(false)}
        onConfigSaved={() => setGatewayConfig(getDirectGatewayConfig())}
        onSwitchToAssistedMode={() => {
          setDispatchMode('assisted');
          setGatewayConfig(getDirectGatewayConfig());
        }}
      />
    </>
  );
};
