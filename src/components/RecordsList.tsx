import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Phone, 
  Mail, 
  MessageCircle, 
  Trash2, 
  Edit3, 
  Sparkles, 
  HeartHandshake, 
  Clock, 
  Calendar,
  Send,
  UserPlus,
  Eye,
  CheckCircle,
  AlertCircle,
  Coffee,
  BarChart3
} from 'lucide-react';
import { RegistrationRecord, PastoralFollowUp, SentMessageLog } from '../types';
import { 
  exportRecordsToCSV, 
  saveStoredRecord, 
  deleteStoredRecord, 
  formatWhatsAppUrl,
  formatGmailComposeUrl,
  formatOutlookComposeUrl,
  formatMailtoUrl
} from '../utils/storage';
import { PrintableCard } from './PrintableCard';
import { ScheduleCoffeeModal } from './ScheduleCoffeeModal';
import { SendFollowUpStepModal } from './SendFollowUpStepModal';

interface RecordsListProps {
  records: RegistrationRecord[];
  logs?: SentMessageLog[];
  onUpdateRecords: () => void;
  onSelectForVerseDispatch?: (records: RegistrationRecord[]) => void;
  onOpenNewForm?: () => void;
  onOpenCharts?: () => void;
}

export const RecordsList: React.FC<RecordsListProps> = ({
  records,
  logs = [],
  onUpdateRecords,
  onSelectForVerseDispatch,
  onOpenNewForm,
  onOpenCharts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecision, setFilterDecision] = useState<string>('todos');
  const [filterCelebration, setFilterCelebration] = useState<string>('todos');
  const [selectedRecordForCard, setSelectedRecordForCard] = useState<RegistrationRecord | null>(null);
  const [editingNotesRecord, setEditingNotesRecord] = useState<RegistrationRecord | null>(null);
  const [schedulingCoffeeRecord, setSchedulingCoffeeRecord] = useState<RegistrationRecord | null>(null);
  const [stepModalData, setStepModalData] = useState<{
    record: RegistrationRecord;
    stage: keyof PastoralFollowUp;
    stageIndex: number;
  } | null>(null);
  const [pastoralNoteText, setPastoralNoteText] = useState('');
  const [responsavelText, setResponsavelText] = useState('');
  const [deleteTargetRecord, setDeleteTargetRecord] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteMultipleModal, setShowDeleteMultipleModal] = useState(false);

  // Selected checkboxes for batch dispatch
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Calculate statistics
  const totalCount = records.length;
  const visitorsCount = records.filter((r) => r.decisionType === 'VISITANTE').length;
  const conversionCount = records.filter((r) => r.decisionType === 'CONVERSAO').length;
  const reconcilCount = records.filter((r) => r.decisionType === 'RECONCILIACAO').length;
  const fullyIntegratedCount = records.filter((r) => r.acompanhamento.visita4).length;
  const aptosCount = records.filter(
    (r) =>
      r.acompanhamento.visita1 &&
      r.acompanhamento.visita2 &&
      r.acompanhamento.visita3 &&
      r.acompanhamento.visita4
  ).length;
  const cafeCount = records.filter((r) => r.acompanhamento.cafeComPastor).length;

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const fullName = `${rec.nome} ${rec.sobrenome}`.toLowerCase();
    const phone = (rec.telemovel || '').toLowerCase();
    const email = (rec.email || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(query) || phone.includes(query) || email.includes(query);
    const matchesDecision = filterDecision === 'todos' || rec.decisionType === filterDecision;
    const matchesCelebration = filterCelebration === 'todos' || rec.celebracaoDomingo === filterCelebration;

    return matchesSearch && matchesDecision && matchesCelebration;
  });

  const handleStepClick = (record: RegistrationRecord, stage: keyof PastoralFollowUp, stageIndex: number) => {
    setStepModalData({ record, stage, stageIndex });
  };

  const handleOpenCafeModal = (record: RegistrationRecord) => {
    const isApto = Boolean(
      record.acompanhamento.visita1 &&
      record.acompanhamento.visita2 &&
      record.acompanhamento.visita3 &&
      record.acompanhamento.visita4
    );

    if (!isApto) {
      alert('Esta pessoa ainda não completou os 4 passos anteriores. Conclua as 4 visitas para que fique apta para marcar o Café com o Pastor.');
      return;
    }
    setSchedulingCoffeeRecord(record);
  };

  const handleOpenNotesModal = (rec: RegistrationRecord) => {
    setEditingNotesRecord(rec);
    setPastoralNoteText(rec.acompanhamento.notasPastorais || '');
    setResponsavelText(rec.acompanhamento.responsavel || '');
  };

  const handleSaveNotes = () => {
    if (!editingNotesRecord) return;
    const updated: RegistrationRecord = {
      ...editingNotesRecord,
      acompanhamento: {
        ...editingNotesRecord.acompanhamento,
        notasPastorais: pastoralNoteText,
        responsavel: responsavelText,
        ultimaInteracao: new Date().toISOString().slice(0, 10),
      },
    };
    saveStoredRecord(updated);
    setEditingNotesRecord(null);
    onUpdateRecords();
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTargetRecord({ id, name });
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetRecord) return;
    deleteStoredRecord(deleteTargetRecord.id);
    setDeleteTargetRecord(null);
    onUpdateRecords();
  };

  const handleConfirmDeleteMultiple = () => {
    selectedIds.forEach((id) => deleteStoredRecord(id));
    setSelectedIds([]);
    setShowDeleteMultipleModal(false);
    onUpdateRecords();
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDispatchToSelected = () => {
    const selectedList = records.filter((r) => selectedIds.includes(r.id));
    if (onSelectForVerseDispatch) {
      onSelectForVerseDispatch(selectedList.length > 0 ? selectedList : records);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Badges with Red/White/Amber theme */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Registos</span>
            <Users className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Banco de dados ativo</span>
        </div>

        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Visitantes</span>
            <Users className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 mt-1">{visitorsCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">1ª Visita</span>
        </div>

        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Conversões</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{conversionCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Novas vidas p/ Cristo</span>
        </div>

        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Reconciliações</span>
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{reconcilCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Retorno ao Senhor</span>
        </div>

        <div className="bg-white border-2 border-red-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Integrados (4 V.)</span>
            <CheckCircle className="w-4 h-4 text-red-700" />
          </div>
          <p className="text-2xl font-black text-red-700 mt-1">{fullyIntegratedCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">{aptosCount} aptos p/ Café</span>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl p-4 shadow-xs border-2 border-amber-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-100">Café c/ Pastor</span>
            <Coffee className="w-4 h-4 text-amber-100" />
          </div>
          <p className="text-2xl font-black mt-1 text-white">{cafeCount}</p>
          <span className="text-[11px] text-amber-100 font-bold block">
            {aptosCount > 0 ? Math.round((cafeCount / aptosCount) * 100) : 0}% de {aptosCount} aptos
          </span>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome, apelido, telemóvel ou e-mail..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDispatchToSelected}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Agendar Versículo ({selectedIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteMultipleModal(true)}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar Selecionados ({selectedIds.length})
                </button>
              </div>
            )}

            {onOpenCharts && (
              <button
                type="button"
                onClick={onOpenCharts}
                className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
                title="Ver Gráficos e Métricas Detalhadas"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Ver Gráficos
              </button>
            )}

            <button
              type="button"
              onClick={() => exportRecordsToCSV(filteredRecords)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
              title="Exportar para formato Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>

            {onOpenNewForm && (
              <button
                type="button"
                onClick={onOpenNewForm}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Novo Registo
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-500 font-bold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filtros:
          </span>

          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="VISITANTE">Visitantes</option>
            <option value="CONVERSAO">Conversões</option>
            <option value="RECONCILIACAO">Reconciliações</option>
          </select>

          <select
            value={filterCelebration}
            onChange={(e) => setFilterCelebration(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="todos">Todas as Celebrações</option>
            <option value="10h">Culto 10h</option>
            <option value="17h">Culto 17h</option>
          </select>

          {(filterDecision !== 'todos' || filterCelebration !== 'todos' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setFilterDecision('todos');
                setFilterCelebration('todos');
                setSearchTerm('');
              }}
              className="text-red-600 hover:text-red-700 font-bold text-xs ml-2 cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-red-600 text-white text-[11px] uppercase tracking-wider font-extrabold">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredRecords.length > 0 && selectedIds.length === filteredRecords.length}
                    onChange={handleSelectAll}
                    className="rounded text-red-600 focus:ring-red-500 accent-white w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-4">Nome & Apelido</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Decisão / Tipo</th>
                <th className="p-4">Origem / Convidado Por</th>
                <th className="p-4">Data & Culto</th>
                <th className="p-4 text-center">Acompanhamento (1-4 & Café c/ Pastor)</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    Nenhum registo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isSelected = selectedIds.includes(rec.id);
                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-red-50/40 transition-colors ${
                        isSelected ? 'bg-red-50/70' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(rec.id)}
                          className="rounded text-red-600 focus:ring-red-600 accent-red-600 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Nome & Apelido */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900">
                          {rec.nome} {rec.sobrenome}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500">{rec.faixaEtaria}</span>
                        </div>
                      </td>

                      {/* Contacto (WhatsApp & Email) */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {rec.telemovel && (
                            <a
                              href={formatWhatsAppUrl(rec.telemovel, `A Paz do Senhor, ${rec.nome}! ✨ Ministério Integrarte - AD Leiria`)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold group"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                              <span>{rec.telemovel}</span>
                            </a>
                          )}
                          {rec.email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-normal">
                              <a
                                href={formatGmailComposeUrl(
                                  rec.email,
                                  'AD Leiria - Ministério Integrarte',
                                  `Olá ${rec.nome},\n\nA Paz do Senhor! É uma grande alegria ter-te em comunhão connosco na AD Leiria - Ministério Integrarte.\n\nQue a presença de Deus abençoe a tua vida.\n\nFraternalmente,\nMinistério Integrarte • AD Leiria`
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 hover:text-red-700 font-medium truncate max-w-[140px]"
                                title="Abrir no Gmail Web"
                              >
                                <Mail className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                <span className="truncate">{rec.email}</span>
                              </a>
                              <a
                                href={formatMailtoUrl(
                                  rec.email,
                                  'AD Leiria - Ministério Integrarte',
                                  `Olá ${rec.nome},\n\nA Paz do Senhor! É uma grande alegria ter-te em comunhão connosco na AD Leiria - Ministério Integrarte.\n\nQue a presença de Deus abençoe a tua vida.\n\nFraternalmente,\nMinistério Integrarte • AD Leiria`
                                )}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-mono"
                                title="Abrir no cliente de e-mail do sistema"
                              >
                                Mail
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Decisão / Tipo */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                            rec.decisionType === 'VISITANTE'
                              ? 'bg-red-100 text-red-800'
                              : rec.decisionType === 'CONVERSAO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rec.decisionType === 'CONVERSAO' && <Sparkles className="w-3 h-3" />}
                          {rec.decisionType === 'RECONCILIACAO' && <HeartHandshake className="w-3 h-3" />}
                          {rec.decisionType}
                        </span>
                      </td>

                      {/* Origem / Convidado Por */}
                      <td className="p-4">
                        <div className="text-xs text-slate-800 font-medium">{rec.comoConheceu}</div>
                        {rec.comoConheceuDetalhe && (
                          <div className="text-[11px] text-red-700 font-bold italic">
                            Por: {rec.comoConheceuDetalhe}
                          </div>
                        )}
                      </td>

                      {/* Data & Culto */}
                      <td className="p-4">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {rec.dataRegisto}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {rec.celebracaoDomingo === '21h' ? 'Culto de Sexta (21h)' : `Culto das ${rec.celebracaoDomingo}`}
                        </div>
                      </td>

                      {/* Acompanhamento (1, 2, 3, 4 + Café com Pastor) */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {(['visita1', 'visita2', 'visita3', 'visita4'] as const).map((stage, idx) => {
                            const isDone = rec.acompanhamento[stage];
                            return (
                              <button
                                key={stage}
                                type="button"
                                onClick={() => handleStepClick(rec, stage, idx)}
                                title={
                                  isDone
                                    ? `Passo ${idx + 1}: Preenchido automaticamente via mensagem enviada. (Clique para ver detalhes ou enviar novo contacto)`
                                    : `Passo ${idx + 1}: Não preenchido. Este campo é preenchido automaticamente ao enviar a mensagem (não pode estar marcado sem mensagem). Clique para enviar!`
                                }
                                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                                  isDone
                                    ? 'bg-red-600 text-white shadow-2xs hover:bg-red-700 ring-2 ring-red-200'
                                    : 'bg-slate-100 text-slate-400 border border-slate-300 hover:bg-slate-200 hover:text-slate-600'
                                }`}
                              >
                                {isDone ? '✓' : idx + 1}
                              </button>
                            );
                          })}

                          {/* Divisor subtil */}
                          <span className="text-slate-300 text-xs select-none">|</span>

                          {/* Campo do lado do número 4: Café com Pastor (Checkbox) */}
                          {(() => {
                            const isApto = Boolean(
                              rec.acompanhamento.visita1 &&
                              rec.acompanhamento.visita2 &&
                              rec.acompanhamento.visita3 &&
                              rec.acompanhamento.visita4
                            );
                            const isDoneCafe = Boolean(rec.acompanhamento.cafeComPastor);
                            const cafeData = rec.acompanhamento.dataCafeComPastor;
                            const cafeHora = rec.acompanhamento.horaCafeComPastor;

                            return (
                              <button
                                type="button"
                                disabled={!isApto}
                                onClick={() => handleOpenCafeModal(rec)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border select-none ${
                                  !isApto
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
                                    : isDoneCafe
                                    ? 'bg-amber-600 text-white border-amber-700 shadow-2xs hover:bg-amber-700 cursor-pointer'
                                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer'
                                }`}
                                title={
                                  !isApto
                                    ? 'Bloqueado: Esta pessoa só fica apta para marcar o Café com o Pastor após completar os 4 passos anteriores.'
                                    : isDoneCafe
                                    ? `Café marcado para ${cafeData || ''} ${cafeHora ? `às ${cafeHora}` : ''}. Clique para ver ou alterar a marcação.`
                                    : 'Apto! Clique para abrir a agenda e marcar data e horário do Café com o Pastor.'
                                }
                              >
                                <Coffee className={`w-3.5 h-3.5 shrink-0 ${isDoneCafe ? 'text-amber-100' : 'text-amber-600'}`} />
                                <span className="text-[11px] whitespace-nowrap">
                                  {isDoneCafe && cafeData
                                    ? `Café Marcado (${cafeData.slice(8, 10)}/${cafeData.slice(5, 7)}${cafeHora ? ` ${cafeHora}` : ''})`
                                    : 'Marcar Café com Pastor'}
                                </span>
                              </button>
                            );
                          })()}
                        </div>
                        {rec.acompanhamento.notasPastorais && (
                          <button
                            type="button"
                            onClick={() => handleOpenNotesModal(rec)}
                            className="text-[10px] text-red-600 hover:underline mt-1 block mx-auto font-bold cursor-pointer"
                          >
                            Ver notas
                          </button>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForCard(rec)}
                            className="p-2 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Ver Ficha Impressa Réplica"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenNotesModal(rec)}
                            className="p-2 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                            title="Editar Notas Pastorais"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(rec.id, `${rec.nome} ${rec.sobrenome}`)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Eliminar Registo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs text-slate-500 flex justify-between items-center">
          <span>A mostrar {filteredRecords.length} de {records.length} registos</span>
          <span className="font-semibold text-slate-700">Ministério Integrarte — AD Leiria</span>
        </div>
      </div>

      {/* Modal: Physical Replica Printable Card */}
      {selectedRecordForCard && (
        <PrintableCard
          record={selectedRecordForCard}
          onClose={() => setSelectedRecordForCard(null)}
        />
      )}

      {/* Modal: Pastoral Notes & Follow-up editor */}
      {editingNotesRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Acompanhamento Pastoral & Notas
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {editingNotesRecord.nome} {editingNotesRecord.sobrenome} ({editingNotesRecord.decisionType})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingNotesRecord(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Líder / Responsável pelo Acolhimento
                </label>
                <input
                  type="text"
                  value={responsavelText}
                  onChange={(e) => setResponsavelText(e.target.value)}
                  placeholder="Ex: Pr. Carlos / Equipa Integrarte"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notas & Observações do Visitante / Decisão
                </label>
                <textarea
                  rows={4}
                  value={pastoralNoteText}
                  onChange={(e) => setPastoralNoteText(e.target.value)}
                  placeholder="Escreva detalhes da conversa, pedidos de oração, integração em grupo familiar/célula, etc..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingNotesRecord(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Guardar Notas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Marcação do Café com o Pastor */}
      {schedulingCoffeeRecord && (
        <ScheduleCoffeeModal
          record={schedulingCoffeeRecord}
          onClose={() => setSchedulingCoffeeRecord(null)}
          onSave={() => {
            setSchedulingCoffeeRecord(null);
            onUpdateRecords();
          }}
        />
      )}

      {/* Modal de Confirmação de Eliminação (Lixeira) */}
      {deleteTargetRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">
              Eliminar Registo
            </h3>
            <p className="text-sm text-slate-600 text-center mt-2 leading-relaxed">
              Tem a certeza que deseja eliminar permanentemente a ficha de <strong className="text-slate-900">{deleteTargetRecord.name}</strong>?
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteTargetRecord(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Eliminação Múltipla */}
      {showDeleteMultipleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">
              Eliminar Registos Selecionados
            </h3>
            <p className="text-sm text-slate-600 text-center mt-2 leading-relaxed">
              Tem a certeza que deseja eliminar permanentemente os <strong className="text-slate-900">{selectedIds.length}</strong> registos selecionados?
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteMultipleModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMultiple}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sim, Eliminar Todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Envio e Preenchimento Automático do Passo de Acompanhamento */}
      {stepModalData && (
        <SendFollowUpStepModal
          record={stepModalData.record}
          stage={stepModalData.stage}
          stageIndex={stepModalData.stageIndex}
          existingLog={logs.find((l) => l.destinatarioNome.includes(stepModalData.record.nome))}
          onClose={() => setStepModalData(null)}
          onSuccess={() => {
            setStepModalData(null);
            onUpdateRecords();
          }}
        />
      )}
    </div>
  );
};
