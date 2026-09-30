import React, { useState } from 'react';
import { 
  History, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Play, 
  MessageCircle, 
  Mail, 
  BookOpen, 
  Users, 
  Eye,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Zap,
  Info,
  ListFilter,
  ShieldCheck
} from 'lucide-react';
import { ScheduledDispatch, SentMessageLog, RegistrationRecord, BibleVerse } from '../types';
import { 
  deleteStoredSchedule, 
  clearAllStoredSchedules,
  clearAllSentLogs,
  saveStoredSchedule, 
  getRecipientsForAudience, 
  replacePlaceholders, 
  addSentLog,
  formatGmailComposeUrl,
  formatOutlookComposeUrl,
  formatMailtoUrl,
  formatWhatsAppUrl
} from '../utils/storage';
import { WhatsAppBulkModal } from './WhatsAppBulkModal';
import { EmailBulkModal } from './EmailBulkModal';

interface DispatchHistoryProps {
  schedules: ScheduledDispatch[];
  logs: SentMessageLog[];
  records: RegistrationRecord[];
  onRefresh: () => void;
  onOpenSchedulerTab?: () => void;
}

export const DispatchHistory: React.FC<DispatchHistoryProps> = ({
  schedules,
  logs,
  records,
  onRefresh,
  onOpenSchedulerTab,
}) => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'logs'>('schedules');
  const [selectedLogForView, setSelectedLogForView] = useState<SentMessageLog | null>(null);
  const [copiedLog, setCopiedLog] = useState(false);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleteAllSchedulesModalOpen, setIsDeleteAllSchedulesModalOpen] = useState(false);
  const [isClearAllLogsModalOpen, setIsClearAllLogsModalOpen] = useState(false);

  // Inspection modal for schedule recipients and personalized messages
  const [inspectScheduleTarget, setInspectScheduleTarget] = useState<ScheduledDispatch | null>(null);
  const [inspectSearch, setInspectSearch] = useState('');

  // Confirmation modal before dispatching a schedule
  const [confirmDispatchTarget, setConfirmDispatchTarget] = useState<ScheduledDispatch | null>(null);

  // Active bulk modals for manual/assisted execution of schedules
  const [activeBulkWhatsApp, setActiveBulkWhatsApp] = useState<{
    schedule: ScheduledDispatch;
    recipients: RegistrationRecord[];
    verse: BibleVerse;
  } | null>(null);

  const [activeBulkEmail, setActiveBulkEmail] = useState<{
    schedule: ScheduledDispatch;
    recipients: RegistrationRecord[];
    verse: BibleVerse;
  } | null>(null);

  const handleCopyLogContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const handleDeleteSchedule = (id: string, title: string) => {
    setDeleteScheduleTarget({ id, title });
  };

  const confirmDeleteSchedule = () => {
    if (!deleteScheduleTarget) return;
    deleteStoredSchedule(deleteScheduleTarget.id);
    setDeleteScheduleTarget(null);
    onRefresh();
  };

  const confirmDeleteAllSchedules = () => {
    clearAllStoredSchedules();
    setIsDeleteAllSchedulesModalOpen(false);
    onRefresh();
  };

  const confirmClearAllLogs = () => {
    clearAllSentLogs();
    setIsClearAllLogsModalOpen(false);
    onRefresh();
  };

  // Called when user clicks "Disparar Agora" - prompts for confirmation first
  const handleRequestScheduleDispatch = (sch: ScheduledDispatch) => {
    setConfirmDispatchTarget(sch);
  };

  // User confirmed in the modal to proceed with dispatch
  const handleProceedWithConfirmedDispatch = () => {
    if (!confirmDispatchTarget) return;
    const sch = confirmDispatchTarget;
    setConfirmDispatchTarget(null);

    const recipients = getRecipientsForAudience(records, sch.targetAudience, sch.selectedPersonIds);
    if (recipients.length === 0) {
      alert('Não existem destinatários cadastrados para o público selecionado nesta programação.');
      return;
    }

    const verseObj: BibleVerse = {
      id: sch.verseId || 'verse-' + Math.random().toString(36).substr(2, 6),
      referencia: sch.verseReferencia,
      texto: sch.verseTexto,
      livro: '',
      capitulo: 0,
      versiculo: '',
      categoria: 'Acolhimento',
    };

    if (sch.canais.includes('whatsapp')) {
      setActiveBulkWhatsApp({
        schedule: sch,
        recipients,
        verse: verseObj,
      });
    } else if (sch.canais.includes('email')) {
      setActiveBulkEmail({
        schedule: sch,
        recipients,
        verse: verseObj,
      });
    }
  };

  const handleFinishScheduleExecution = (sch: ScheduledDispatch) => {
    const updated: ScheduledDispatch = {
      ...sch,
      status: 'concluido',
      enviadosSucesso: sch.totalDestinatarios,
      executadoEm: new Date().toISOString(),
    };
    saveStoredSchedule(updated);
    setActiveBulkWhatsApp(null);
    setActiveBulkEmail(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border-2 border-red-600 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-red-600" />
            Programações & Histórico de Envios
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Monitorize todas as programações de versículos e o histórico real de mensagens.
          </p>
        </div>

        {/* Actions & Tab Switch */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {activeTab === 'schedules' && schedules.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDeleteAllSchedulesModalOpen(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Eliminar todas as mensagens programadas automáticas"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Eliminar Todas as Programações</span>
            </button>
          )}

          {activeTab === 'logs' && logs.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllLogsModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Limpar todos os registos do histórico"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Limpar Histórico</span>
            </button>
          )}

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('schedules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'schedules'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Programações ({schedules.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Histórico ({logs.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'schedules' ? (
        /* SCHEDULED DISPATCHES LIST */
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
              <Calendar className="w-12 h-12 text-red-200 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">Nenhuma mensagem programada no momento.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Crie um novo agendamento ou monte a sua lista de mensagens para enviar com total controlo e confirmação.
              </p>
              {onOpenSchedulerTab && (
                <button
                  type="button"
                  onClick={onOpenSchedulerTab}
                  className="mt-4 px-5 py-2.5 bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-red-700 shadow-xs cursor-pointer"
                >
                  Criar Nova Programação
                </button>
              )}
            </div>
          ) : (
            schedules.map((sch) => {
              const isAgendado = sch.status === 'agendado';
              const isPendente = sch.status === 'pendente_envio';
              const isExecutando = sch.status === 'executando';
              const isFalha = sch.status === 'falha';
              const isConcluido = sch.status === 'concluido';
              const scheduleRecipients = getRecipientsForAudience(records, sch.targetAudience, sch.selectedPersonIds);

              return (
                <div
                  key={sch.id}
                  className={`bg-white border-2 rounded-3xl p-6 shadow-sm transition-all ${
                    isPendente 
                      ? 'border-amber-500 ring-4 ring-amber-100' 
                      : isAgendado 
                      ? 'border-red-600' 
                      : isFalha
                      ? 'border-rose-400'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          isPendente
                            ? 'bg-amber-100 text-amber-700'
                            : isAgendado
                            ? 'bg-red-50 text-red-600'
                            : isFalha
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {sch.titulo}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-bold text-red-600">{sch.verseReferencia}</span>
                          <span>•</span>
                          <span>Público: {sch.targetAudience.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isAgendado && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-amber-100 text-amber-900">
                          <Clock className="w-3.5 h-3.5" /> ⏳ Agendado
                        </span>
                      )}
                      {isPendente && (
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 bg-amber-500 text-white animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" /> ⏰ Horário Atingido (Aguardando Sua Aprovação)
                        </span>
                      )}
                      {isExecutando && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-blue-100 text-blue-800">
                          <Zap className="w-3.5 h-3.5 animate-spin" /> A Enviar...
                        </span>
                      )}
                      {isFalha && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5" /> Falha no Envio
                        </span>
                      )}
                      {isConcluido && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Concluído ({sch.enviadosSucesso} entregues)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 font-medium block">Data e Horário:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {sch.dataProgramada} às {sch.horaProgramada}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 font-medium block">Canais:</span>
                      <div className="flex items-center gap-2 mt-0.5 font-bold text-slate-900">
                        {sch.canais.includes('whatsapp') && (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </span>
                        )}
                        {sch.canais.includes('email') && (
                          <span className="flex items-center gap-1 text-red-600">
                            <Mail className="w-3.5 h-3.5" /> E-mail
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 font-medium block">Destinatários:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {sch.totalDestinatarios} pessoas
                      </span>
                    </div>
                  </div>

                  {sch.motivoFalha && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs mb-4 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Aviso do Sistema:</span> {sch.motivoFalha}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs text-slate-700 italic font-serif mb-4">
                    "{sch.verseTexto}"
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                    <span className="text-[11px] text-slate-400">
                      Criado em {new Date(sch.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                      {/* View List & Messages Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setInspectScheduleTarget(sch);
                          setInspectSearch('');
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Ver lista de pessoas e mensagens formatadas"
                      >
                        <ListFilter className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ver Lista ({scheduleRecipients.length})</span>
                      </button>

                      {/* Dispatch Button with Pre-Confirmation */}
                      {(isAgendado || isPendente || isFalha) && (
                        <button
                          type="button"
                          onClick={() => handleRequestScheduleDispatch(sch)}
                          className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all ${
                            isPendente
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                          title="Disparar após confirmação"
                        >
                          <Play className="w-3.5 h-3.5" /> 
                          <span>{isPendente ? 'Aprovar & Disparar' : 'Disparar Agora'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(sch.id, sch.titulo)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar esta programação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* SENT LOGS TABLE */
        <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-red-600 text-white text-[11px] uppercase tracking-wider font-black">
                <tr>
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4">Canal</th>
                  <th className="p-4">Destinatário</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4">Versículo Enviado</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhuma mensagem enviada registada até ao momento.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSuccess = log.status === 'enviado';
                    const isFailed = log.status === 'falha';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-600 text-xs">
                          {new Date(log.dataEnvio).toLocaleString('pt-PT')}
                        </td>
                        <td className="p-4">
                          {log.tipo === 'whatsapp' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs">
                              <Mail className="w-3.5 h-3.5" /> E-mail
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-900">{log.destinatarioNome}</td>
                        <td className="p-4 text-xs text-slate-600 font-mono">{log.destinatarioContacto}</td>
                        <td className="p-4 font-bold text-red-600">{log.versiculoRef}</td>
                        <td className="p-4 text-center">
                          {isSuccess && (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">
                              Entregue
                            </span>
                          )}
                          {isFailed && (
                            <span 
                              className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full uppercase cursor-help"
                              title={log.motivoFalha || 'Falha no envio'}
                            >
                              Falha no Envio
                            </span>
                          )}
                          {!isSuccess && !isFailed && (
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase">
                              Agendado
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLogForView(log)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Ver conteúdo da mensagem"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: View Sent Message Details */}
      {selectedLogForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Registo de Envio
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Para: {selectedLogForView.destinatarioNome} ({selectedLogForView.destinatarioContacto})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForView(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-red-600">{selectedLogForView.versiculoRef}</span>
                <span className="text-slate-400">
                  {new Date(selectedLogForView.dataEnvio).toLocaleString('pt-PT')}
                </span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedLogForView.conteudo}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCopyLogContent(selectedLogForView.conteudo)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLog ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLogForView(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inspecionar Lista de Destinatários & Mensagens Formatadas de uma Programação */}
      {inspectScheduleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-red-600" />
                  Lista de Mensagens da Programação
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {inspectScheduleTarget.titulo} • {inspectScheduleTarget.verseReferencia}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectScheduleTarget(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Filter Search */}
            <input
              type="text"
              value={inspectSearch}
              onChange={(e) => setInspectSearch(e.target.value)}
              placeholder="Filtrar por nome, telemóvel ou email..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
            />

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const recipients = getRecipientsForAudience(
                  records,
                  inspectScheduleTarget.targetAudience,
                  inspectScheduleTarget.selectedPersonIds
                ).filter((r) => {
                  const query = inspectSearch.toLowerCase();
                  return (
                    r.nome.toLowerCase().includes(query) ||
                    r.sobrenome.toLowerCase().includes(query) ||
                    r.telemovel.includes(query) ||
                    (r.email && r.email.toLowerCase().includes(query))
                  );
                });

                if (recipients.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Nenhum destinatário encontrado com o filtro pesquisado.
                    </div>
                  );
                }

                return recipients.map((r, idx) => {
                  const formatted = replacePlaceholders(
                    inspectScheduleTarget.mensagemTemplate,
                    r,
                    inspectScheduleTarget.verseReferencia,
                    inspectScheduleTarget.verseTexto
                  );

                  return (
                    <div
                      key={r.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-black text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-slate-900">
                            {r.nome} {r.sobrenome}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                            {r.decisionType}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {r.telemovel || r.email}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 italic font-serif text-[11px] leading-relaxed">
                        {formatted}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const target = inspectScheduleTarget;
                  setInspectScheduleTarget(null);
                  handleRequestScheduleDispatch(target);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Prosseguir para Disparo</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectScheduleTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmação Obrigatória Antes de Disparar ("Não envie sem antes me perguntar") */}
      {confirmDispatchTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg text-slate-900">
                Confirmar Autorização de Envio
              </h3>
              <p className="text-xs text-slate-500">
                O sistema não enviará nada sem a sua confirmação explícita.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Programação:</span>
                <span className="font-bold text-slate-900">{confirmDispatchTarget.titulo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Versículo / Mensagem:</span>
                <span className="font-bold text-red-600">{confirmDispatchTarget.verseReferencia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Total de Destinatários:</span>
                <span className="font-black text-slate-900">{confirmDispatchTarget.totalDestinatarios} pessoas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Canais Selecionados:</span>
                <span className="font-bold text-slate-800">
                  {confirmDispatchTarget.canais.join(', ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDispatchTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ✕ Cancelar / Não Enviar
              </button>
              <button
                type="button"
                onClick={handleProceedWithConfirmedDispatch}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sim, Autorizar Envio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete SINGLE Schedule */}
      {deleteScheduleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              Eliminar Agendamento?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tem a certeza de que deseja eliminar o envio programado{' '}
              <strong className="text-slate-800 font-bold">"{deleteScheduleTarget.title}"</strong>?
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteScheduleTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteSchedule}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete ALL Schedules (Requested by user) */}
      {isDeleteAllSchedulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="font-black text-lg text-slate-900">
              Eliminar TODAS as Mensagens Programadas?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tem a certeza de que deseja eliminar e cancelar <strong>TODAS as {schedules.length} programações</strong> de envio automático?
              <br /><br />
              <span className="text-rose-600 font-bold">Nenhum envio automático pendente será disparado. Esta ação é irreversível.</span>
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAllSchedulesModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteAllSchedules}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Sim, Eliminar Todas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear ALL Logs */}
      {isClearAllLogsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              Limpar Todo o Histórico de Registos?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deseja apagar os {logs.length} registos de mensagens enviadas?
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllLogsModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmClearAllLogs}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Limpar Registos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Dispatch Modals for Triggering Scheduled Dispatches */}
      {activeBulkWhatsApp && (
        <WhatsAppBulkModal
          recipients={activeBulkWhatsApp.recipients}
          verse={activeBulkWhatsApp.verse}
          messageTemplate={activeBulkWhatsApp.schedule.mensagemTemplate}
          onClose={() => setActiveBulkWhatsApp(null)}
          onFinished={() => handleFinishScheduleExecution(activeBulkWhatsApp.schedule)}
        />
      )}

      {activeBulkEmail && (
        <EmailBulkModal
          recipients={activeBulkEmail.recipients}
          verse={activeBulkEmail.verse}
          messageTemplate={activeBulkEmail.schedule.mensagemTemplate}
          onClose={() => setActiveBulkEmail(null)}
          onFinished={() => handleFinishScheduleExecution(activeBulkEmail.schedule)}
        />
      )}
    </div>
  );
};


