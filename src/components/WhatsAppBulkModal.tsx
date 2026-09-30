import React, { useState } from 'react';
import { 
  MessageCircle, 
  ExternalLink, 
  X, 
  Copy, 
  Check,
  Zap,
  Settings,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { RegistrationRecord, BibleVerse } from '../types';
import { formatWhatsAppUrl, replacePlaceholders, addSentLog, recordMessageSentForPerson } from '../utils/storage';
import { 
  sendDirectWhatsAppMessage, 
  getDirectGatewayConfig, 
  DirectGatewayConfig 
} from '../utils/directSender';
import { DirectGatewayModal } from './DirectGatewayModal';

interface WhatsAppBulkModalProps {
  recipients: RegistrationRecord[];
  verse: BibleVerse;
  messageTemplate: string;
  onClose: () => void;
  onFinished?: () => void;
}

export const WhatsAppBulkModal: React.FC<WhatsAppBulkModalProps> = ({
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

  // Dispatch mode: 'direct' (background without opening WhatsApp Web) vs 'assisted' (WhatsApp Web tabs)
  const [dispatchMode, setDispatchMode] = useState<'direct' | 'assisted'>('direct');
  const [isSendingDirectBatch, setIsSendingDirectBatch] = useState(false);
  const [directCurrentName, setDirectCurrentName] = useState<string | null>(null);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [directNotification, setDirectNotification] = useState<string | null>(null);
  const [gatewayConfig, setGatewayConfig] = useState<DirectGatewayConfig>(getDirectGatewayConfig());

  const isGatewayReady = Boolean(
    gatewayConfig.whatsappGatewayUrl && gatewayConfig.whatsappGatewayUrl.trim().startsWith('http')
  );

  // Single Assisted Send (Opens WhatsApp Web)
  const handleSendSingleAssisted = (rec: RegistrationRecord) => {
    const formattedMsg = replacePlaceholders(
      messageTemplate,
      rec,
      verse.referencia,
      verse.texto,
      verse.reflexaoBreve
    );
    const url = formatWhatsAppUrl(rec.telemovel, formattedMsg);

    // Open WhatsApp Web or mobile app
    window.open(url, '_blank');

    // Mark as sent
    setSentMap((prev) => ({ ...prev, [rec.id]: true }));

    // Add sent log and advance follow-up automatically
    recordMessageSentForPerson(rec.id, {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      tipo: 'whatsapp',
      versiculoRef: verse.referencia,
      conteudo: formattedMsg,
      dataEnvio: new Date().toISOString(),
      status: 'enviado',
      destinatarioNome: `${rec.nome} ${rec.sobrenome}`.trim(),
      destinatarioContacto: rec.telemovel,
    });

    // Advance to next if not at end
    if (currentIndex < recipients.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Single Direct Send (Background API)
  const handleSendSingleDirect = async (rec: RegistrationRecord) => {
    if (!isGatewayReady) {
      setIsGatewayModalOpen(true);
      setDirectNotification('⚠️ Para envio direto, configure a API de WhatsApp ou use o modo WhatsApp Web.');
      return;
    }

    const formattedMsg = replacePlaceholders(
      messageTemplate,
      rec,
      verse.referencia,
      verse.texto,
      verse.reflexaoBreve
    );

    const res = await sendDirectWhatsAppMessage(rec.telemovel, formattedMsg, undefined, `${rec.nome} ${rec.sobrenome}`.trim());
    if (res.success) {
      setSentMap((prev) => ({ ...prev, [rec.id]: true }));
      setErrorMap((prev) => {
        const next = { ...prev };
        delete next[rec.id];
        return next;
      });

      recordMessageSentForPerson(rec.id, {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        tipo: 'whatsapp',
        versiculoRef: verse.referencia,
        conteudo: formattedMsg,
        dataEnvio: new Date().toISOString(),
        status: 'enviado',
        destinatarioNome: `${rec.nome} ${rec.sobrenome}`.trim(),
        destinatarioContacto: rec.telemovel,
      });

      setDirectNotification(`Mensagem para ${rec.nome} enviada diretamente em segundo plano!`);
      setTimeout(() => setDirectNotification(null), 3000);
    } else {
      setErrorMap((prev) => ({ ...prev, [rec.id]: res.error || 'Erro ao enviar' }));
      if (res.notConfigured) {
        setIsGatewayModalOpen(true);
      }
    }
  };

  // Batch Direct Dispatch (Automatic background iteration without opening WhatsApp Web)
  const handleStartDirectBatch = async () => {
    if (isSendingDirectBatch) return;

    if (!isGatewayReady) {
      setIsGatewayModalOpen(true);
      setDirectNotification('⚠️ Para envio direto sem abrir telas, configure a sua API de WhatsApp (UltraMsg ou Evolution API) ou mude para o modo WhatsApp Web.');
      return;
    }

    setIsSendingDirectBatch(true);
    setDirectNotification('A iniciar envio automático em segundo plano...');

    const pending = recipients.filter((r) => !sentMap[r.id] && r.telemovel);
    if (pending.length === 0) {
      setDirectNotification('Todos os contactos elegíveis já foram enviados!');
      setIsSendingDirectBatch(false);
      return;
    }

    let successCount = 0;

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

      const res = await sendDirectWhatsAppMessage(rec.telemovel, formattedMsg, undefined, `${rec.nome} ${rec.sobrenome}`.trim());

      if (res.success) {
        successCount++;
        setSentMap((prev) => ({ ...prev, [rec.id]: true }));
        recordMessageSentForPerson(rec.id, {
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          tipo: 'whatsapp',
          versiculoRef: verse.referencia,
          conteudo: formattedMsg,
          dataEnvio: new Date().toISOString(),
          status: 'enviado',
          destinatarioNome: `${rec.nome} ${rec.sobrenome}`.trim(),
          destinatarioContacto: rec.telemovel,
        });
      } else {
        setErrorMap((prev) => ({ ...prev, [rec.id]: res.error || 'Falha no envio' }));
      }

      // Gentle pause to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    setDirectCurrentName(null);
    setIsSendingDirectBatch(false);
    setDirectNotification(`✓ Concluído! ${successCount} mensagens disparadas diretamente em segundo plano sem abrir o WhatsApp Web.`);
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
    recipients.forEach((r) => {
      newMap[r.id] = true;
      recordMessageSentForPerson(r.id, {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        tipo: 'whatsapp',
        versiculoRef: verse.referencia,
        conteudo: replacePlaceholders(messageTemplate, r, verse.referencia, verse.texto, verse.reflexaoBreve),
        dataEnvio: new Date().toISOString(),
        status: 'enviado',
        destinatarioNome: `${r.nome} ${r.sobrenome}`.trim(),
        destinatarioContacto: r.telemovel,
      });
    });
    setSentMap(newMap);
  };

  const sentCount = Object.values(sentMap).filter(Boolean).length;
  const progressPercent = Math.round((sentCount / Math.max(recipients.length, 1)) * 100);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-6 border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-emerald-700 text-white p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                  Disparo de Mensagens WhatsApp
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">
                    {dispatchMode === 'direct' ? 'Direto em 2º Plano' : 'Assistido (WhatsApp Web)'}
                  </span>
                </h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Versículo: <span className="font-bold text-white">{verse.referencia}</span> • {recipients.length} destinatários
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsGatewayModalOpen(true)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Configurações de Gateway / API"
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
          <div className="bg-emerald-50/70 border-b border-emerald-100 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900">Modo de Envio:</span>
              <div className="flex bg-white rounded-xl p-1 border border-emerald-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDispatchMode('direct')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    dispatchMode === 'direct'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  Envio Direto (Sem abrir abas)
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchMode('assisted')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    dispatchMode === 'assisted'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  WhatsApp Web
                </button>
              </div>
            </div>

            {dispatchMode === 'direct' && (
              <button
                type="button"
                disabled={isSendingDirectBatch || sentCount === recipients.length}
                onClick={handleStartDirectBatch}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all ${
                  isSendingDirectBatch
                    ? 'bg-amber-500 text-white animate-pulse'
                    : sentCount === recipients.length
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
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
                    <span>Disparar Todos Diretamente ({recipients.length - sentCount})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Gateway Warning Banner if in direct mode and not configured */}
          {dispatchMode === 'direct' && !isGatewayReady && (
            <div className="bg-amber-50 border-b border-amber-200 p-3 px-5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>API não configurada:</strong> Para disparar sem abrir o WhatsApp Web, adicione a sua API no botão ⚙️ ou mude para o modo WhatsApp Web gratuito.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGatewayModalOpen(true)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer text-xs"
                >
                  Configurar API ⚙️
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchMode('assisted')}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-lg cursor-pointer text-xs"
                >
                  WhatsApp Web
                </button>
              </div>
            </div>
          )}

          {/* Direct Sending Live Status / Notification */}
          {(directNotification || directCurrentName) && (
            <div className="bg-emerald-800 text-white px-4 py-2 text-xs flex items-center justify-between animate-fade-in font-medium">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                {directCurrentName ? `A disparar: ${directCurrentName}` : directNotification}
              </span>
              {directNotification && (
                <button
                  type="button"
                  onClick={() => setDirectNotification(null)}
                  className="text-emerald-200 hover:text-white font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Progresso dos Envios</span>
                <span>
                  {sentCount} de {recipients.length} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleMarkAllSent}
              className="text-[11px] text-emerald-700 font-bold hover:underline shrink-0 cursor-pointer"
            >
              Marcar todos como enviados
            </button>
          </div>

          {/* Recipients List & Interactive Dispatch */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {dispatchMode === 'direct' ? (
              <p className="text-xs text-slate-500 mb-2 font-medium">
                No modo <strong>Envio Direto</strong>, as mensagens são processadas em segundo plano sem abrir abas do navegador. Clique em <strong>"Disparar Todos Diretamente"</strong> acima ou envie individualmente:
              </p>
            ) : (
              <p className="text-xs text-slate-500 mb-2 font-medium">
                Clique no botão <strong>"Abrir no WhatsApp Web"</strong> para abrir a conversa no WhatsApp Web com a mensagem preenchida:
              </p>
            )}

            {recipients.map((rec, index) => {
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
                          {rec.telemovel || 'Sem telemóvel registado'}
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
                        title="Copiar texto da mensagem"
                      >
                        {copiedId === rec.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === rec.id ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      {dispatchMode === 'direct' ? (
                        <button
                          type="button"
                          disabled={!rec.telemovel || isSendingDirectBatch}
                          onClick={() => handleSendSingleDirect(rec)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>{isSent ? 'Reenviar Direto' : 'Enviar Direto'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!rec.telemovel}
                          onClick={() => handleSendSingleAssisted(rec)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{isSent ? 'Reabrir WhatsApp' : 'Abrir WhatsApp Web'}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </button>
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
              <span className="font-bold text-slate-700">{sentCount}</span> de {recipients.length} enviados
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setIsGatewayModalOpen(true)}
                className="text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" /> Configurar Gateway de API
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
