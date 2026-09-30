import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  MessageCircle, 
  Coffee, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  Send,
  Zap,
  ExternalLink
} from 'lucide-react';
import { RegistrationRecord, SentMessageLog } from '../types';
import { saveStoredRecord, formatWhatsAppUrl, recordMessageSentForPerson } from '../utils/storage';
import { sendDirectWhatsAppMessage, getDirectGatewayConfig } from '../utils/directSender';

interface ScheduleCoffeeModalProps {
  record: RegistrationRecord;
  onClose: () => void;
  onSave: (updatedRecord: RegistrationRecord) => void;
}

export const ScheduleCoffeeModal: React.FC<ScheduleCoffeeModalProps> = ({
  record,
  onClose,
  onSave,
}) => {
  const followUp = record.acompanhamento;

  // Defaults
  const todayStr = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(followUp.dataCafeComPastor || todayStr);
  const [hora, setHora] = useState(followUp.horaCafeComPastor || '16:00');
  const [local, setLocal] = useState(followUp.localCafeComPastor || 'Gabinete Pastoral - AD Leiria');
  const [responsavel, setResponsavel] = useState(followUp.responsavel || 'Pr. Titular / Equipa Pastoral');
  const [status, setStatus] = useState<'marcado' | 'realizado'>(
    followUp.statusCafeComPastor === 'realizado' ? 'realizado' : 'marcado'
  );
  const [notas, setNotas] = useState(followUp.notasPastorais || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmUnschedule, setConfirmUnschedule] = useState(false);

  // Direct WhatsApp API state
  const gatewayConfig = getDirectGatewayConfig();
  const hasDirectWhatsApp = Boolean(
    gatewayConfig.whatsappGatewayUrl && gatewayConfig.whatsappGatewayUrl.trim().startsWith('http')
  );
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [directFeedback, setDirectFeedback] = useState<string | null>(null);
  const [directSuccess, setDirectSuccess] = useState(false);
  const [autoSendOnSave, setAutoSendOnSave] = useState(hasDirectWhatsApp);

  // Common time suggestions
  const suggestedTimes = ['10:00', '11:00', '14:30', '16:00', '17:30', '19:00'];

  // Format date nicely for preview (e.g. 2026-09-10 -> 10/09/2026)
  const formatFriendlyDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [year, month, day] = dStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  const whatsappMessage = `A Paz do Senhor, ${record.nome}! ☕\n\nGostaríamos de confirmar com alegria o nosso *Café com o Pastor* na AD Leiria:\n📅 *Data:* ${formatFriendlyDate(data)}\n⏰ *Horário:* ${hora}\n📍 *Local:* ${local}\n👤 *Com:* ${responsavel}\n\nSerá um tempo precioso de comunhão e oração por si e pela sua família. Confirma a sua presença? Deus abençoe!\n_Ministério Integrarte • AD Leiria_`;

  const [customMessage, setCustomMessage] = useState(whatsappMessage);
  const [isMessageEdited, setIsMessageEdited] = useState(false);

  useEffect(() => {
    if (!isMessageEdited) {
      setCustomMessage(whatsappMessage);
    }
  }, [data, hora, local, responsavel, isMessageEdited, whatsappMessage]);

  // Send message automatically via direct API
  const handleSendDirectApi = async (messageToSend?: string): Promise<boolean> => {
    if (!record.telemovel) {
      setDirectFeedback('O membro/visitante não tem número de telemóvel registado.');
      return false;
    }

    const msg = messageToSend || customMessage || whatsappMessage;
    setIsSendingDirect(true);
    setDirectFeedback(null);

    const res = await sendDirectWhatsAppMessage(
      record.telemovel,
      msg,
      undefined,
      `${record.nome} ${record.sobrenome}`.trim()
    );

    if (res.success) {
      const logPayload: SentMessageLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        tipo: 'whatsapp',
        versiculoRef: 'Confirmação Café com o Pastor (API)',
        conteudo: msg,
        dataEnvio: new Date().toISOString(),
        status: 'enviado',
        destinatarioNome: `${record.nome} ${record.sobrenome}`.trim(),
        destinatarioContacto: record.telemovel || '',
      };
      recordMessageSentForPerson(record.id, logPayload);

      setIsSendingDirect(false);
      setDirectSuccess(true);
      setDirectFeedback(`✓ Mensagem enviada automaticamente pela API com sucesso para ${record.telemovel}!`);
      return true;
    } else {
      setIsSendingDirect(false);
      setDirectSuccess(false);
      setDirectFeedback(`Falha no envio automático: ${res.error || 'Erro desconhecido'}. Pode usar o botão "Abrir WhatsApp".`);
      return false;
    }
  };

  const handleSave = async () => {
    if (!data) {
      setErrorMessage('Por favor, selecione a data da marcação do café.');
      return;
    }
    setErrorMessage(null);

    const msg = customMessage || whatsappMessage;

    // Send automatically via API if option is checked and not yet sent
    if (autoSendOnSave && record.telemovel && hasDirectWhatsApp && !directSuccess) {
      await handleSendDirectApi(msg);
    }

    const updatedRecord: RegistrationRecord = {
      ...record,
      acompanhamento: {
        ...record.acompanhamento,
        cafeComPastor: true,
        dataCafeComPastor: data,
        horaCafeComPastor: hora,
        localCafeComPastor: local,
        statusCafeComPastor: status,
        responsavel: responsavel.trim(),
        notasPastorais: notas.trim(),
        ultimaInteracao: new Date().toISOString().slice(0, 10),
      },
    };

    saveStoredRecord(updatedRecord);
    onSave(updatedRecord);
    onClose();
  };

  const handleUnschedule = () => {
    if (!confirmUnschedule) {
      setConfirmUnschedule(true);
      return;
    }

    const updatedRecord: RegistrationRecord = {
      ...record,
      acompanhamento: {
        ...record.acompanhamento,
        cafeComPastor: false,
        dataCafeComPastor: undefined,
        horaCafeComPastor: undefined,
        localCafeComPastor: undefined,
        statusCafeComPastor: undefined,
        ultimaInteracao: new Date().toISOString().slice(0, 10),
      },
    };

    saveStoredRecord(updatedRecord);
    onSave(updatedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-red-700 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Coffee className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-200 block">
                Agendamento Pastoral • AD Leiria
              </span>
              <h3 className="text-xl font-black tracking-tight text-white">
                Marcar Café com o Pastor
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dados da Pessoa selecionada */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                  Dados do Membro / Visitante
                </span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">
                  {record.nome} {record.sobrenome}
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-600 font-medium">
                  {record.telemovel ? (
                    <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {record.telemovel}
                    </span>
                  ) : (
                    <span className="text-slate-400">Sem telefone</span>
                  )}
                  {record.email && (
                    <span className="inline-flex items-center gap-1 text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border border-amber-200 truncate max-w-[200px]">
                      <Mail className="w-3 h-3 text-red-500" />
                      {record.email}
                    </span>
                  )}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                4 Passos Concluídos
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-200/60 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Origem / Registo</span>
                <span className="font-semibold text-slate-800">{record.decisionType} • {record.celebracaoDomingo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Faixa Etária</span>
                <span className="font-semibold text-slate-800">{record.faixaEtaria}</span>
              </div>
            </div>
          </div>

          {/* Formulário de Agenda e Horário */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-red-600" />
              Agenda & Horário da Marcação
            </h4>

            {/* Data e Hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Data do Café *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Horário *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Sugestões de Horário Rápido */}
            <div>
              <span className="text-[11px] text-slate-500 font-medium block mb-1">
                Horários frequentes:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {suggestedTimes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setHora(t)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      hora === t
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Local do Café */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Local / Espaço do Café
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex: Gabinete Pastoral - AD Leiria ou Cafetaria"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Responsável / Pastor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pastor Responsável / Com quem
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Ex: Pr. Titular / Equipa Pastoral"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Status da Marcação */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Situação do Agendamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('marcado')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    status === 'marcado'
                      ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  Agendado (A Realizar)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('realizado')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    status === 'realizado'
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Já Concluído / Tomado
                </button>
              </div>
            </div>

            {/* Notas e Observações */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Observações Pastorais para o Encontro
              </label>
              <textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ex: Conversar sobre integração no departamento de jovens, batismo nas águas, oração..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Convidar via WhatsApp com envio automático pela API ou WhatsApp Web */}
            {record.telemovel ? (
              <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                        Confirmação de Agendamento por WhatsApp
                      </h5>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Destinatário: <strong className="font-bold">{record.telemovel}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Botão de Envio Automático pela API */}
                    <button
                      type="button"
                      disabled={isSendingDirect || !record.telemovel}
                      onClick={() => handleSendDirectApi()}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Enviar mensagem automaticamente em segundo plano pela API sem abrir o WhatsApp"
                    >
                      {isSendingDirect ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>A Enviar via API...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Automático via API</span>
                        </>
                      )}
                    </button>

                    {/* Botão Fallback WhatsApp Web */}
                    <a
                      href={formatWhatsAppUrl(record.telemovel, customMessage || whatsappMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Abrir no aplicativo ou WhatsApp Web"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Feedback de envio direto */}
                {directFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 animate-in fade-in ${
                      directSuccess
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}
                  >
                    {directSuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{directFeedback}</span>
                  </div>
                )}

                {/* Pré-visualização e edição da Mensagem */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
                    <span>Texto que será enviado ao membro/visitante:</span>
                    {hasDirectWhatsApp ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                        <Zap className="w-3 h-3 text-emerald-700" />
                        API Direta Ativa
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-800 font-medium">
                        (Dica: configure a API no menu de engrenagem para envio silencioso)
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={customMessage}
                    onChange={(e) => {
                      setIsMessageEdited(true);
                      setCustomMessage(e.target.value);
                    }}
                    className="w-full p-2.5 text-xs font-mono bg-white rounded-xl border border-emerald-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                {/* Opção de Envio Automático ao Guardar */}
                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={autoSendOnSave}
                    onChange={(e) => setAutoSendOnSave(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-emerald-950">
                    Enviar esta mensagem automaticamente pela API ao clicar em "Confirmar Marcação"
                  </span>
                </label>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Esta pessoa não tem número de telemóvel registado para envio automático por WhatsApp.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <div>
            {followUp.cafeComPastor && (
              <button
                type="button"
                onClick={handleUnschedule}
                className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  confirmUnschedule
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-600 hover:bg-red-50'
                }`}
                title="Remover marcação de café"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmUnschedule ? 'Confirmar Desmarcação?' : 'Desmarcar Café'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Marcação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
