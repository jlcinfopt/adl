import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Send, 
  Calendar, 
  Clock, 
  MessageCircle, 
  Mail, 
  Plus, 
  Check, 
  Eye, 
  RotateCcw, 
  FileText, 
  Search, 
  CheckCircle2, 
  Trash2,
  Pencil,
  BookmarkPlus,
  Save,
  FolderHeart,
  AlertCircle,
  HelpCircle,
  X,
  Users,
  CheckSquare,
  Square,
  Filter,
  ListFilter,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { 
  BibleVerse, 
  RegistrationRecord, 
  AudienceFilter, 
  ScheduledDispatch,
  SavedMessageTemplate
} from '../types';
import { 
  DEFAULT_WHATSAPP_TEMPLATE, 
  INITIAL_VERSES 
} from '../data/initialData';
import { 
  getStoredVerses, 
  saveStoredVerse, 
  deleteStoredVerse, 
  saveStoredSchedule, 
  getRecipientsForAudience, 
  replacePlaceholders,
  addSentLog,
  getSavedTemplates,
  saveMessageTemplate,
  deleteSavedTemplate,
  getActiveDraftTemplate,
  saveActiveDraftTemplate,
  getStoredDefaultMessage,
  saveStoredDefaultMessage,
  resetStoredDefaultMessage,
} from '../utils/storage';
import { subscribeToDefaultMessage } from '../utils/cloudSync';
import { WhatsAppBulkModal } from './WhatsAppBulkModal';
import { EmailBulkModal } from './EmailBulkModal';

interface VerseSchedulerProps {
  records: RegistrationRecord[];
  onScheduleCreated?: () => void;
  preSelectedRecords?: RegistrationRecord[];
}

export const VerseScheduler: React.FC<VerseSchedulerProps> = ({
  records,
  onScheduleCreated,
  preSelectedRecords,
}) => {
  const [verses, setVerses] = useState<BibleVerse[]>(getStoredVerses);
  const [selectedVerseId, setSelectedVerseId] = useState<string>('');
  const [verseCategoryFilter, setVerseCategoryFilter] = useState<string>('todos');
  const [verseSearch, setVerseSearch] = useState('');

  // Target audience
  const [audience, setAudience] = useState<AudienceFilter>(
    preSelectedRecords && preSelectedRecords.length > 0 ? 'personalizado' : 'todos'
  );
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(
    preSelectedRecords ? preSelectedRecords.map((r) => r.id) : []
  );

  // Custom List Builder Filter States
  const [customListSearch, setCustomListSearch] = useState('');
  const [customListFilterType, setCustomListFilterType] = useState<string>('todos');
  const [isCustomListExpanded, setIsCustomListExpanded] = useState(audience === 'personalizado');

  // Channels
  const [useWhatsApp, setUseWhatsApp] = useState(true);
  const [useEmail, setUseEmail] = useState(true);

  // Scheduling type
  const [dispatchMode, setDispatchMode] = useState<'schedule' | 'now'>('schedule');
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [scheduleDate, setScheduleDate] = useState(tomorrow);
  const [scheduleTime, setScheduleTime] = useState('08:30');
  const [campaignTitle, setCampaignTitle] = useState('Mensagem & Palavra Bíblica - Ministério Integrarte');

  // Message template & Active preview channel
  const [messageTemplate, setMessageTemplate] = useState<string>(() => getStoredDefaultMessage());
  const [activePreviewChannel, setActivePreviewChannel] = useState<'whatsapp' | 'email'>('whatsapp');

  // Modal for inspecting complete message list
  const [isMessageListModalOpen, setIsMessageListModalOpen] = useState(false);
  const [messageListSearch, setMessageListSearch] = useState('');

  // Cloud sync listener for default message
  useEffect(() => {
    const unsub = subscribeToDefaultMessage((cloudMsg) => {
      if (cloudMsg !== undefined && cloudMsg !== null) {
        const currentSaved = localStorage.getItem('adleiria_default_user_message_v1');
        if (!currentSaved || currentSaved === cloudMsg) {
          setMessageTemplate(cloudMsg);
        }
      }
    });
    return () => unsub();
  }, []);

  // New Custom Message modal state
  const [isAddingVerse, setIsAddingVerse] = useState(false);
  const [editingVerseId, setEditingVerseId] = useState<string | null>(null);
  const [newMessageType, setNewMessageType] = useState<'mensagem' | 'versiculo'>('mensagem');
  const [newTituloMensagem, setNewTituloMensagem] = useState('');
  const [newLivro, setNewLivro] = useState('');
  const [newCapitulo, setNewCapitulo] = useState('');
  const [newVersiculoNum, setNewVersiculoNum] = useState('');
  const [newTexto, setNewTexto] = useState('');
  const [newCategoria, setNewCategoria] = useState<BibleVerse['categoria']>('1 Acolhimento');
  const [newReflexao, setNewReflexao] = useState('');

  // WhatsApp & Email Assistant Modals
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Fallback when no verses/messages are yet created
  const fallbackEmptyVerse: BibleVerse = {
    id: '',
    referencia: 'Sem mensagem selecionada',
    livro: '',
    capitulo: 0,
    versiculo: '',
    texto: 'Crie a sua mensagem personalizada para visualizar aqui.',
    categoria: '1 Acolhimento',
  };

  // Get selected verse object
  const selectedVerse = verses.find((v) => v.id === selectedVerseId) || verses[0] || fallbackEmptyVerse;

  // Keep messageTemplate in sync with selected verse only when a verse is explicitly chosen
  useEffect(() => {
    if (selectedVerseId) {
      const v = verses.find((item) => item.id === selectedVerseId);
      if (v && v.texto) {
        setMessageTemplate(v.texto);
      }
    }
  }, [selectedVerseId, verses]);

  // Filtered recipients
  const targetRecipients = getRecipientsForAudience(records, audience, selectedPersonIds);

  // Filter verses/messages
  const filteredVerses = verses.filter((v) => {
    let matchesCat = verseCategoryFilter === 'todos';
    if (!matchesCat) {
      if (v.categoria === verseCategoryFilter) {
        matchesCat = true;
      } else if (
        verseCategoryFilter.includes('Acolhimento') &&
        (v.categoria === 'Acolhimento' || v.categoria.includes('Acolhimento'))
      ) {
        matchesCat = true;
      } else if (
        verseCategoryFilter.includes('Cuidado') &&
        v.categoria.includes('Cuidado')
      ) {
        matchesCat = true;
      } else if (
        verseCategoryFilter.includes('Regressar') &&
        v.categoria.includes('Regressar')
      ) {
        matchesCat = true;
      } else if (
        verseCategoryFilter.includes('Café') &&
        (v.categoria.includes('Café') || v.categoria.includes('Cafe'))
      ) {
        matchesCat = true;
      }
    }

    const matchesSearch =
      v.referencia.toLowerCase().includes(verseSearch.toLowerCase()) ||
      v.texto.toLowerCase().includes(verseSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelectVerse = (v: BibleVerse) => {
    setSelectedVerseId(v.id);
    setMessageTemplate(v.texto);
  };

  const handleOpenAddVerse = () => {
    setEditingVerseId(null);
    setNewMessageType('mensagem');
    setNewTituloMensagem('');
    setNewLivro('');
    setNewCapitulo('');
    setNewVersiculoNum('');
    setNewTexto('');
    setNewReflexao('');
    setNewCategoria(verseCategoryFilter !== 'todos' ? (verseCategoryFilter as any) : '1 Acolhimento');
    setIsAddingVerse(true);
  };

  const handleOpenEditVerse = (v: BibleVerse) => {
    setEditingVerseId(v.id);
    if (v.tipo === 'versiculo' || (v.livro && v.livro !== 'Mensagem Pastoral' && v.capitulo)) {
      setNewMessageType('versiculo');
      setNewLivro(v.livro || '');
      setNewCapitulo(v.capitulo ? v.capitulo.toString() : '1');
      setNewVersiculoNum(v.versiculo || '1');
      setNewTituloMensagem('');
    } else {
      setNewMessageType('mensagem');
      setNewTituloMensagem(v.referencia || '');
      setNewLivro('');
      setNewCapitulo('');
      setNewVersiculoNum('');
    }
    setNewTexto(v.texto || '');
    setNewCategoria(v.categoria || '1 Acolhimento');
    setNewReflexao(v.reflexaoBreve || '');
    setIsAddingVerse(true);
  };

  const handleCloseModal = () => {
    setIsAddingVerse(false);
    setEditingVerseId(null);
    setNewTituloMensagem('');
    setNewLivro('');
    setNewCapitulo('');
    setNewVersiculoNum('');
    setNewTexto('');
    setNewReflexao('');
  };

  // Handle Add / Edit Message / Verse
  const handleSaveNewMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTexto.trim()) return;

    let ref = '';
    let livro = '';
    let cap = 1;
    let versNum = '1';

    if (newMessageType === 'mensagem') {
      if (!newTituloMensagem.trim()) return;
      ref = newTituloMensagem.trim();
      livro = 'Mensagem Pastoral';
      cap = 1;
      versNum = '1';
    } else {
      if (!newLivro.trim() || !newCapitulo) return;
      ref = `${newLivro.trim()} ${newCapitulo}:${newVersiculoNum.trim() || '1'}`;
      livro = newLivro.trim();
      cap = parseInt(newCapitulo, 10) || 1;
      versNum = newVersiculoNum.trim() || '1';
    }

    const verseId = editingVerseId || ('custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4));

    const newRecord: BibleVerse = {
      id: verseId,
      referencia: ref,
      livro,
      capitulo: cap,
      versiculo: versNum,
      texto: newTexto.trim(),
      categoria: newCategoria,
      reflexaoBreve: newReflexao.trim() || undefined,
      tipo: newMessageType,
    };

    const updated = saveStoredVerse(newRecord);
    setVerses(updated);
    setSelectedVerseId(verseId);
    setIsAddingVerse(false);
    setEditingVerseId(null);
    setSuccessNotification(
      editingVerseId
        ? `Mensagem "${ref}" alterada com sucesso!`
        : `Nova mensagem "${ref}" adicionada com sucesso!`
    );
    setTimeout(() => setSuccessNotification(null), 5000);

    // Reset form
    setNewTituloMensagem('');
    setNewLivro('');
    setNewCapitulo('');
    setNewVersiculoNum('');
    setNewTexto('');
    setNewReflexao('');
  };

  const handleDeleteVerse = (id: string, ref: string) => {
    const updated = deleteStoredVerse(id);
    setVerses(updated);
    if (selectedVerseId === id) {
      setSelectedVerseId(updated[0]?.id || '');
    }
    setSuccessNotification(`Mensagem "${ref}" removida.`);
    setTimeout(() => setSuccessNotification(null), 3500);
  };

  // Helper to toggle a single person in the custom selection list
  const handleTogglePerson = (id: string) => {
    if (audience !== 'personalizado') {
      // Switch audience to custom and seed with current filtered ids
      const currentIds = targetRecipients.map((r) => r.id);
      const nextIds = currentIds.includes(id)
        ? currentIds.filter((item) => item !== id)
        : [...currentIds, id];
      setAudience('personalizado');
      setSelectedPersonIds(nextIds);
      setIsCustomListExpanded(true);
    } else {
      setSelectedPersonIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  // Select all records matching the builder filter
  const handleSelectAllBuilderFiltered = () => {
    const matchingIds = filteredRecordsForBuilder.map((r) => r.id);
    setAudience('personalizado');
    setSelectedPersonIds((prev) => {
      const combined = new Set([...prev, ...matchingIds]);
      return Array.from(combined);
    });
  };

  // Deselect all records matching the builder filter
  const handleDeselectAllBuilderFiltered = () => {
    const matchingIds = new Set(filteredRecordsForBuilder.map((r) => r.id));
    setAudience('personalizado');
    setSelectedPersonIds((prev) => prev.filter((id) => !matchingIds.has(id)));
  };

  // Remove person directly from recipient list (used inside list inspection modal)
  const handleRemoveRecipientFromBatch = (id: string) => {
    if (audience !== 'personalizado') {
      const currentIds = targetRecipients.map((r) => r.id).filter((item) => item !== id);
      setAudience('personalizado');
      setSelectedPersonIds(currentIds);
    } else {
      setSelectedPersonIds((prev) => prev.filter((item) => item !== id));
    }
    setSuccessNotification('Destinatário removido desta lista de envio.');
    setTimeout(() => setSuccessNotification(null), 3000);
  };

  // Handle Direct Dispatch or Automatic Scheduling
  const handleExecuteDispatchOrSchedule = () => {
    if (verses.length === 0) {
      alert('Por favor crie a sua mensagem de acolhimento antes de realizar ou programar o envio.');
      setIsAddingVerse(true);
      return;
    }

    if (!useWhatsApp && !useEmail) {
      alert('Por favor selecione pelo menos um canal de envio (WhatsApp ou E-mail).');
      return;
    }

    if (targetRecipients.length === 0) {
      alert('Não há destinatários selecionados. Por favor monte ou selecione a sua lista.');
      return;
    }

    if (!messageTemplate.trim()) {
      alert('Por favor escreva o texto da mensagem antes de enviar.');
      return;
    }

    const channels: ('whatsapp' | 'email')[] = [];
    if (useWhatsApp) channels.push('whatsapp');
    if (useEmail) channels.push('email');

    if (dispatchMode === 'now') {
      if (useWhatsApp) {
        setIsWhatsAppModalOpen(true);
      } else if (useEmail) {
        setIsEmailModalOpen(true);
      }
    } else {
      const newSchedule: ScheduledDispatch = {
        id: 'sch-' + Date.now().toString(36),
        titulo: campaignTitle || `Envio de ${selectedVerse.referencia}`,
        verseId: selectedVerse.id,
        verseReferencia: selectedVerse.referencia,
        verseTexto: selectedVerse.texto,
        targetAudience: audience,
        selectedPersonIds: audience === 'personalizado' ? selectedPersonIds : undefined,
        canais: channels,
        dataProgramada: scheduleDate,
        horaProgramada: scheduleTime,
        mensagemTemplate: messageTemplate,
        status: 'agendado',
        createdAt: new Date().toISOString(),
        totalDestinatarios: targetRecipients.length,
        enviadosSucesso: 0,
      };

      saveStoredSchedule(newSchedule);
      setSuccessNotification(
        `✓ Lista montada e aprovada com sucesso! O envio para ${targetRecipients.length} pessoas está programado para o dia ${scheduleDate} às ${scheduleTime} e será disparado automaticamente.`
      );
      setTimeout(() => setSuccessNotification(null), 6000);

      if (onScheduleCreated) {
        onScheduleCreated();
      }
    }
  };

  // Builder filtered records
  const filteredRecordsForBuilder = useMemo(() => {
    return records.filter((r) => {
      // Type filter
      if (customListFilterType === 'VISITANTE' && r.decisionType !== 'VISITANTE') return false;
      if (customListFilterType === 'CONVERSAO' && r.decisionType !== 'CONVERSAO') return false;
      if (customListFilterType === 'RECONCILIACAO' && r.decisionType !== 'RECONCILIACAO') return false;
      if (customListFilterType === '1a_visita' && r.visitType !== '1a_visita') return false;

      // Search filter
      if (customListSearch.trim()) {
        const q = customListSearch.toLowerCase().trim();
        const fullName = `${r.nome} ${r.sobrenome}`.toLowerCase();
        const tel = (r.telemovel || '').toLowerCase();
        const email = (r.email || '').toLowerCase();
        return fullName.includes(q) || tel.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [records, customListFilterType, customListSearch]);

  // Sample recipient for live preview
  const previewPerson: RegistrationRecord = targetRecipients[0] || {
    id: 'sample',
    createdAt: new Date().toISOString(),
    decisionType: 'VISITANTE',
    visitType: '1a_visita',
    nome: 'Roseane',
    sobrenome: 'Gomes',
    telemovel: '+351 963 054 307',
    email: 'roseane.gomes@exemplo.pt',
    faixaEtaria: '35 anos acima',
    comoConheceu: 'Por intermédio de alguém',
    autorizacaoRgpd: true,
    dataRegisto: '2026-08-27',
    celebracaoDomingo: '17h',
    acompanhamento: { visita1: true, visita2: false, visita3: false, visita4: false, notasPastorais: '' },
  };

  const previewFormattedText = replacePlaceholders(
    messageTemplate,
    previewPerson,
    selectedVerse.referencia,
    selectedVerse.texto,
    selectedVerse.reflexaoBreve
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border-2 border-red-600 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              Envio Programado de Mensagens & Palavra Bíblica
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-1">
              Agendamento & Envio de Mensagens
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl">
              Selecione uma mensagem pastoral ou versículo bíblico, personalize o modelo e o sistema cuidará do envio para todos os visitantes e membros cadastrados.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingVerse(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors shadow-md shrink-0 self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Nova Mensagem
          </button>
        </div>
      </div>

      {successNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{successNotification}</p>
        </div>
      )}

      {/* Main 2-Column Workspace: Left Config, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 1. Select Verse, 2. Target Audience, 3. Schedule Time */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: SELECT BIBLE VERSE OR MESSAGE */}
          <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs">
                  1
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Selecionar Mensagem ou Versículo
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {filteredVerses.length} disponíveis
              </span>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {(
                [
                  'todos',
                  '1 Acolhimento',
                  '2 Cuidado e Encorajamento',
                  '3 Convite para Regressar',
                  '4 Convite ao Café com o Pastor',
                ] as const
              ).map((cat) => {
                const isSelected = verseCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setVerseCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'todos' ? 'Todos' : cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={verseSearch}
                onChange={(e) => setVerseSearch(e.target.value)}
                placeholder="Pesquisar por livro, capítulo ou palavra-chave..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
              />
            </div>

            {/* Verses Scrollable List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {filteredVerses.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-red-200 rounded-2xl bg-red-50/30">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Nenhuma mensagem criada nesta guia
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
                    Crie as suas próprias mensagens personalizadas para esta etapa e envie por WhatsApp ou E-mail.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddVerse}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Mensagem {verseCategoryFilter !== 'todos' ? `(${verseCategoryFilter})` : ''}</span>
                  </button>
                </div>
              ) : (
                filteredVerses.map((v) => {
                  const isSelected = v.id === selectedVerseId;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVerse(v)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-red-600 bg-red-50/70 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{v.referencia}</span>
                          <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                            {v.categoria}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs mr-0.5">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditVerse(v);
                            }}
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Alterar mensagem"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVerse(v.id, v.referencia);
                            }}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar mensagem da lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 italic font-serif">
                        {v.texto}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* STEP 2: TARGET AUDIENCE & CHANNELS */}
          <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Público-Alvo & Destinatários
                  </h3>
                  <p className="text-xs text-slate-500">
                    Escolha o grupo ou monte a sua própria lista personalizada de envio
                  </p>
                </div>
              </div>

              {/* Inspector trigger button */}
              {targetRecipients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsMessageListModalOpen(true)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ver todas as mensagens formatadas para cada pessoa antes de enviar"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Ver Lista ({targetRecipients.length})</span>
                </button>
              )}
            </div>

            {/* Audience Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Grupo de Destinatários ({targetRecipients.length} selecionados)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (audience !== 'personalizado') {
                      setSelectedPersonIds(targetRecipients.map((r) => r.id));
                      setAudience('personalizado');
                    }
                    setIsCustomListExpanded(!isCustomListExpanded);
                  }}
                  className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  {isCustomListExpanded ? 'Recolher Lista' : 'Ajustar Lista Manualmente'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    { id: 'todos', label: 'Todas as Pessoas', desc: `${records.length} cadastros` },
                    { id: 'visitantes', label: 'Apenas Visitantes', desc: `${records.filter(r=>r.decisionType==='VISITANTE').length} pessoas` },
                    { id: 'conversoes', label: 'Novas Conversões', desc: `${records.filter(r=>r.decisionType==='CONVERSAO').length} pessoas` },
                    { id: 'reconciliacoes', label: 'Reconciliações', desc: `${records.filter(r=>r.decisionType==='RECONCILIACAO').length} pessoas` },
                    { id: 'visita_1', label: 'Apenas 1ª Visita', desc: `${records.filter(r=>r.visitType==='1a_visita').length} pessoas` },
                    { id: 'personalizado', label: '🎯 Minha Lista Manual', desc: `${selectedPersonIds.length} selecionadas` },
                  ] as const
                ).map((opt) => {
                  const isSelected = audience === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setAudience(opt.id);
                        if (opt.id === 'personalizado') {
                          setIsCustomListExpanded(true);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-red-600 bg-red-50 text-red-700 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Interactive List Builder (Allows user to explicitly pick each person) */}
            {(audience === 'personalizado' || isCustomListExpanded) && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-red-600" />
                    <span className="font-black text-xs text-slate-900">
                      Montar Lista de Destinatários ({selectedPersonIds.length} selecionadas)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllBuilderFiltered}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Selecionar Todas ({filteredRecordsForBuilder.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllBuilderFiltered}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                {/* Filter and Search inside custom builder */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={customListSearch}
                      onChange={(e) => setCustomListSearch(e.target.value)}
                      placeholder="Filtrar por nome, telefone ou e-mail..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'VISITANTE', label: 'Visitantes' },
                      { id: 'CONVERSAO', label: 'Conversões' },
                      { id: 'RECONCILIACAO', label: 'Reconciliações' },
                      { id: '1a_visita', label: '1ª Visita' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCustomListFilterType(tab.id)}
                        className={`px-2 py-1 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                          customListFilterType === tab.id
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable list of persons */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {filteredRecordsForBuilder.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl">
                      Nenhuma pessoa encontrada com este filtro.
                    </div>
                  ) : (
                    filteredRecordsForBuilder.map((record) => {
                      const isChecked = selectedPersonIds.includes(record.id);
                      return (
                        <div
                          key={record.id}
                          onClick={() => handleTogglePerson(record.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-red-50/70 border-red-300'
                              : 'bg-white border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by parent div
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <span>{record.nome} {record.sobrenome}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-semibold">
                                  {record.decisionType}
                                </span>
                                {record.visitType === '1a_visita' && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                                    1ª Visita
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {record.telemovel || 'Sem telemóvel'} • {record.email || 'Sem e-mail'}
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isChecked ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isChecked ? 'Na lista' : 'Excluído'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Channels Selection */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Canais de Notificação
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                    useWhatsApp ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">WhatsApp</span>
                      <span className="text-[11px] text-slate-500">Envio direto c/ template formatado</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useWhatsApp}
                    onChange={(e) => setUseWhatsApp(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <label
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                    useEmail ? 'border-red-600 bg-red-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-5 h-5 text-red-600" />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">E-mail Pastoral</span>
                      <span className="text-[11px] text-slate-500">Boletim com layout e reflexão</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useEmail}
                    onChange={(e) => setUseEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* STEP 3: DATE & SCHEDULING MODE */}
          <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs">
                3
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Data, Horário & Programação
              </h3>
            </div>

            {/* Mode Switch: Schedule vs Instant */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDispatchMode('schedule')}
                className={`py-3 px-4 rounded-2xl border-2 text-center text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  dispatchMode === 'schedule'
                    ? 'border-red-600 bg-red-600 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Programar Data e Dia</span>
              </button>

              <button
                type="button"
                onClick={() => setDispatchMode('now')}
                className={`py-3 px-4 rounded-2xl border-2 text-center text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  dispatchMode === 'now'
                    ? 'border-red-600 bg-red-600 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Disparar Imediatamente</span>
              </button>
            </div>

            {dispatchMode === 'schedule' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-red-50/50 p-4 rounded-2xl border border-red-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Programada
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário Programado
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>
            )}

            {/* Campaign Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Título do Envio / Identificação Pastoral
              </label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="Ex: Versículo Semanal de Encorajamento"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Live Preview & Dispatch Action */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Box (WhatsApp / Email toggle) */}
          <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                Pré-visualização Real
              </h3>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActivePreviewChannel('whatsapp')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activePreviewChannel === 'whatsapp'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewChannel('email')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activePreviewChannel === 'email'
                      ? 'bg-red-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  E-mail
                </button>
              </div>
            </div>

            {activePreviewChannel === 'whatsapp' ? (
              /* WhatsApp Simulated Bubble */
              <div className="bg-[#efeae2] p-4 rounded-2xl border border-slate-300 min-h-[220px] flex flex-col justify-end text-xs">
                <div className="bg-white rounded-2xl rounded-tr-none p-4 shadow-sm max-w-[90%] ml-auto border border-emerald-100 space-y-2">
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
                    {previewFormattedText}
                  </p>
                  <div className="text-[10px] text-slate-400 text-right font-mono flex items-center justify-end gap-1">
                    <span>{scheduleTime || '08:30'}</span>
                    <span className="text-emerald-600 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Email Simulated Pastoral Card */
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 space-y-3 text-xs">
                <div className="border-b border-slate-200 pb-2">
                  <div className="text-slate-500 font-mono text-[11px]">
                    De: integrarte@adleiria.pt
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    Para: {previewPerson.email || 'roseane.gomes@exemplo.pt'}
                  </div>
                  <div className="font-bold text-slate-800 mt-1 text-xs">
                    Assunto: Palavra Bíblica para ti — {selectedVerse.referencia}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-black text-red-600 uppercase text-[11px] tracking-wider">
                    AD LEIRIA • MINISTÉRIO INTEGRARTE
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {previewFormattedText}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={handleExecuteDispatchOrSchedule}
            className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
          >
            {dispatchMode === 'schedule' ? (
              <>
                <Calendar className="w-5 h-5" />
                <span>Programar Envio ({targetRecipients.length} pessoas selecionadas)</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Disparar Agora ({targetRecipients.length} pessoas selecionadas)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal: Adicionar / Alterar Mensagem / Versículo */}
      {isAddingVerse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingVerseId ? 'Alterar Mensagem' : 'Adicionar Nova Mensagem'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingVerseId
                    ? 'Edite os dados, conteúdo e categoria desta mensagem'
                    : 'Cadastre uma nova mensagem pastoral ou passagem bíblica'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Toggle between Mensagem Pastoral and Versículo Bíblico */}
            <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setNewMessageType('mensagem');
                  setNewCategoria('Mensagem Pastoral');
                }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  newMessageType === 'mensagem'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Mensagem Pastoral / Geral
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewMessageType('versiculo');
                  setNewCategoria(verseCategoryFilter !== 'todos' ? (verseCategoryFilter as any) : '1 Acolhimento');
                }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  newMessageType === 'versiculo'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Versículo Bíblico
              </button>
            </div>

            <form onSubmit={handleSaveNewMessage} className="space-y-3.5">
              {newMessageType === 'mensagem' ? (
                /* Fields for Mensagem Pastoral */
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Título ou Assunto da Mensagem <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newTituloMensagem}
                      onChange={(e) => setNewTituloMensagem(e.target.value)}
                      placeholder="Ex: Mensagem de Acolhimento, Boas-Vindas à AD Leiria"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoria / Guia
                    </label>
                    <select
                      value={newCategoria}
                      onChange={(e) => setNewCategoria(e.target.value as BibleVerse['categoria'])}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                    >
                      <option value="1 Acolhimento">1 Acolhimento</option>
                      <option value="2 Cuidado e Encorajamento">2 Cuidado e Encorajamento</option>
                      <option value="3 Convite para Regressar">3 Convite para Regressar</option>
                      <option value="4 Convite ao Café com o Pastor">4 Convite ao Café com o Pastor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Texto da Mensagem <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={newTexto}
                      onChange={(e) => setNewTexto(e.target.value)}
                      placeholder="Escreva o conteúdo completo da mensagem..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assinatura / Bênção Final (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newReflexao}
                      onChange={(e) => setNewReflexao(e.target.value)}
                      placeholder="Ex: Em Cristo, Pastoral Integrarte | AD Leiria"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                    />
                  </div>
                </>
              ) : (
                /* Fields for Versículo Bíblico */
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Livro <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newLivro}
                        onChange={(e) => setNewLivro(e.target.value)}
                        placeholder="Ex: Salmos, João, Romanos"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Capítulo <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={newCapitulo}
                        onChange={(e) => setNewCapitulo(e.target.value)}
                        placeholder="Ex: 23"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Versículo(s)
                      </label>
                      <input
                        type="text"
                        value={newVersiculoNum}
                        onChange={(e) => setNewVersiculoNum(e.target.value)}
                        placeholder="Ex: 1-3 ou 11"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Categoria / Guia
                      </label>
                      <select
                        value={newCategoria}
                        onChange={(e) => setNewCategoria(e.target.value as BibleVerse['categoria'])}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                      >
                        <option value="1 Acolhimento">1 Acolhimento</option>
                        <option value="2 Cuidado e Encorajamento">2 Cuidado e Encorajamento</option>
                        <option value="3 Convite para Regressar">3 Convite para Regressar</option>
                        <option value="4 Convite ao Café com o Pastor">4 Convite ao Café com o Pastor</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Texto Bíblico Completo <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={newTexto}
                      onChange={(e) => setNewTexto(e.target.value)}
                      placeholder="Ex: 'O Senhor é o meu pastor; nada me faltará...'"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reflexão Pastoral / Bênção (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newReflexao}
                      onChange={(e) => setNewReflexao(e.target.value)}
                      placeholder="Ex: Que a paz do Senhor guarde o teu coração nesta semana!"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:bg-white"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {editingVerseId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {editingVerseId ? 'Guardar Alterações' : 'Guardar Mensagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Interactive Sender Assistant Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppBulkModal
          recipients={targetRecipients}
          verse={selectedVerse}
          messageTemplate={messageTemplate}
          onClose={() => setIsWhatsAppModalOpen(false)}
          onFinished={() => {
            setIsWhatsAppModalOpen(false);
            if (useEmail) {
              setIsEmailModalOpen(true);
            } else {
              setSuccessNotification('Envio via WhatsApp processado com sucesso!');
              setTimeout(() => setSuccessNotification(null), 5000);
            }
          }}
        />
      )}

      {/* Email Interactive Sender Assistant Modal */}
      {isEmailModalOpen && (
        <EmailBulkModal
          recipients={targetRecipients}
          verse={selectedVerse}
          messageTemplate={messageTemplate}
          onClose={() => setIsEmailModalOpen(false)}
          onFinished={() => {
            setIsEmailModalOpen(false);
            setSuccessNotification('Envio de e-mails pastorais processado com sucesso!');
            setTimeout(() => setSuccessNotification(null), 5000);
          }}
        />
      )}

      {/* MODAL: Complete List of Messages & Recipient Inspection */}
      {isMessageListModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
                  <ListFilter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Lista de Mensagens a Enviar
                  </h3>
                  <p className="text-xs text-slate-500">
                    {targetRecipients.length} destinatários selecionados para este envio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMessageListModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter within list */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={messageListSearch}
                onChange={(e) => setMessageListSearch(e.target.value)}
                placeholder="Filtrar por nome na lista..."
                className="w-full bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none"
              />
              {messageListSearch && (
                <button
                  type="button"
                  onClick={() => setMessageListSearch('')}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Message items list */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {targetRecipients.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Nenhum destinatário selecionado. Por favor escolha o público-alvo no Passo 2.
                </div>
              ) : (
                targetRecipients
                  .filter((rec) => {
                    if (!messageListSearch.trim()) return true;
                    const q = messageListSearch.toLowerCase();
                    const full = `${rec.nome} ${rec.sobrenome}`.toLowerCase();
                    return full.includes(q);
                  })
                  .map((rec, index) => {
                    const formatted = replacePlaceholders(messageTemplate, rec, selectedVerse);
                    return (
                      <div
                        key={rec.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-red-200 transition-colors"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {index + 1}
                            </span>
                            <span className="font-black text-xs text-slate-900">
                              {rec.nome} {rec.sobrenome}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-600">
                              {rec.decisionType}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                              {rec.telemovel || 'Sem telefone'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipientFromBatch(rec.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Remover apenas esta pessoa do envio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">Remover</span>
                            </button>
                          </div>
                        </div>

                        {/* Formatted message preview */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                          {formatted}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                Total a enviar: <strong className="text-slate-900">{targetRecipients.length} pessoas</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsMessageListModalOpen(false)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Concluir & Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
