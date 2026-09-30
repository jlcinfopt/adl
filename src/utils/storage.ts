import { BibleVerse, RegistrationRecord, ScheduledDispatch, SentMessageLog, SavedMessageTemplate, SavedVoiceRecording } from '../types';
import { INITIAL_RECORDS, INITIAL_SCHEDULES, INITIAL_VERSES, DEFAULT_WHATSAPP_TEMPLATE } from '../data/initialData';
import {
  syncRecordToCloud,
  deleteRecordFromCloud,
  syncVerseToCloud,
  deleteVerseFromCloud,
  syncScheduleToCloud,
  deleteScheduleFromCloud,
  clearAllSchedulesFromCloud,
  syncLogToCloud,
  clearAllLogsFromCloud,
  syncDefaultMessageToCloud,
} from './cloudSync';
import {
  sendDirectWhatsAppMessage,
  sendDirectEmailMessage,
  getDirectGatewayConfig,
} from './directSender';

const STORAGE_KEYS = {
  RECORDS: 'adleiria_registration_records_v1',
  VERSES: 'adleiria_bible_verses_v1',
  SCHEDULES: 'adleiria_scheduled_dispatches_v1',
  LOGS: 'adleiria_sent_message_logs_v1',
  SAVED_TEMPLATES: 'adleiria_saved_templates_v1',
  ACTIVE_DRAFT: 'adleiria_active_template_draft_v1',
  DEFAULT_USER_MESSAGE: 'adleiria_default_user_message_v1',
  SAVED_VOICE_RECORDINGS: 'adleiria_saved_voice_recordings_v1',
};

// --- RECORDS CRUD ---
export function getMessageCountForRecord(record: RegistrationRecord, logs?: SentMessageLog[]): number {
  const allLogs = logs || getSentLogs();
  const cleanPhone = cleanPhoneNumber(record.telemovel || '');
  const recEmail = (record.email || '').toLowerCase().trim();
  const recFullName = `${record.nome} ${record.sobrenome}`.toLowerCase().trim();

  const matchingLogs = allLogs.filter((log) => {
    if (log.status === 'falha') return false;
    const logPhone = cleanPhoneNumber(log.destinatarioContacto || '');
    const logEmail = (log.destinatarioContacto || '').toLowerCase().trim();
    const logName = (log.destinatarioNome || '').toLowerCase().trim();

    if (cleanPhone && logPhone && (cleanPhone === logPhone || logPhone.includes(cleanPhone) || cleanPhone.includes(logPhone))) {
      return true;
    }
    if (recEmail && logEmail && recEmail === logEmail) {
      return true;
    }
    if (recFullName && logName && recFullName === logName) {
      return true;
    }
    return false;
  });

  return matchingLogs.length;
}

export function getLogsForRecord(record: RegistrationRecord, logs?: SentMessageLog[]): SentMessageLog[] {
  const allLogs = logs || getSentLogs();
  const cleanPhone = cleanPhoneNumber(record.telemovel || '');
  const recEmail = (record.email || '').toLowerCase().trim();
  const recFullName = `${record.nome} ${record.sobrenome}`.toLowerCase().trim();

  return allLogs.filter((log) => {
    if (log.status === 'falha') return false;
    const logPhone = cleanPhoneNumber(log.destinatarioContacto || '');
    const logEmail = (log.destinatarioContacto || '').toLowerCase().trim();
    const logName = (log.destinatarioNome || '').toLowerCase().trim();

    if (cleanPhone && logPhone && (cleanPhone === logPhone || logPhone.includes(cleanPhone) || cleanPhone.includes(logPhone))) {
      return true;
    }
    if (recEmail && logEmail && recEmail === logEmail) {
      return true;
    }
    if (recFullName && logName && recFullName === logName) {
      return true;
    }
    return false;
  });
}

export function syncRecordWithSentMessages(record: RegistrationRecord, logs?: SentMessageLog[]): RegistrationRecord {
  const allLogs = logs || getSentLogs();
  const matchingLogs = getLogsForRecord(record, allLogs);

  // Strict Rule: If no message was sent to this person, NO STEPS are marked!
  if (matchingLogs.length === 0) {
    return {
      ...record,
      acompanhamento: {
        ...record.acompanhamento,
        visita1: false,
        visita2: false,
        visita3: false,
        visita4: false,
        cafeComPastor: false,
      },
    };
  }

  // Detect which specific steps (1, 2, 3, 4) were actually sent to this person
  let hasStep1 = false;
  let hasStep2 = false;
  let hasStep3 = false;
  let hasStep4 = false;

  matchingLogs.forEach((log) => {
    const ref = (log.versiculoRef || '').toLowerCase();
    const content = (log.conteudo || '').toLowerCase();

    // Step 1: Acolhimento
    if (
      ref.includes('passo 1') ||
      ref.includes('1. acolhimento') ||
      ref.includes('acolhimento') ||
      ref.includes('msg-1') ||
      content.includes('foi uma alegria receber a sua presença') ||
      content.includes('bruno malheiro')
    ) {
      hasStep1 = true;
    }

    // Step 2: Cuidado e Encorajamento
    if (
      ref.includes('passo 2') ||
      ref.includes('2. cuidado') ||
      ref.includes('cuidado') ||
      ref.includes('msg-2') ||
      content.includes('restante de semana abençoada') ||
      content.includes('nós celebramos, nós cuidamos e nós crescemos')
    ) {
      hasStep2 = true;
    }

    // Step 3: Convite para Regressar
    if (
      ref.includes('passo 3') ||
      ref.includes('3. convite para regressar') ||
      ref.includes('regressar') ||
      ref.includes('msg-3') ||
      content.includes('sexta-feira às 21h') ||
      content.includes('domingo teremos celebração')
    ) {
      hasStep3 = true;
    }

    // Step 4: Convite ao Café com o Pastor
    if (
      ref.includes('passo 4') ||
      ref.includes('4. convite ao café') ||
      ref.includes('café com o pastor') ||
      ref.includes('cafe com o pastor') ||
      ref.includes('msg-4') ||
      content.includes('café com o pastor') ||
      content.includes('cafe com o pastor')
    ) {
      hasStep4 = true;
    }
  });

  const count = matchingLogs.length;
  // Fallback to sequential count if messages were sent without specific step tags
  const visita1 = hasStep1 || count >= 1;
  const visita2 = hasStep2 || (visita1 && count >= 2);
  const visita3 = hasStep3 || (visita2 && count >= 3);
  const visita4 = hasStep4 || (visita3 && count >= 4);

  const isApto = visita1 && visita2 && visita3 && visita4;
  const cafeComPastor = isApto ? Boolean(record.acompanhamento.cafeComPastor) : false;

  const latestInteraction = matchingLogs[0]?.dataEnvio
    ? matchingLogs[0].dataEnvio.slice(0, 10)
    : record.acompanhamento.ultimaInteracao;

  return {
    ...record,
    acompanhamento: {
      ...record.acompanhamento,
      visita1,
      visita2,
      visita3,
      visita4,
      cafeComPastor,
      ultimaInteracao: latestInteraction,
    },
  };
}

export function getStoredRecords(): RegistrationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const demoIds = ['rec-1', 'rec-2', 'rec-3', 'rec-4'];
    let parsed: RegistrationRecord[] = raw ? JSON.parse(raw) : INITIAL_RECORDS;
    parsed = parsed.filter((r) => !demoIds.includes(r.id));
    const logs = getSentLogs();

    // Synchronize so that uncontacted people are never falsely marked
    let hasChanges = false;
    const synced = parsed.map((rec) => {
      const updated = syncRecordWithSentMessages(rec, logs);
      if (
        updated.acompanhamento.visita1 !== rec.acompanhamento.visita1 ||
        updated.acompanhamento.visita2 !== rec.acompanhamento.visita2 ||
        updated.acompanhamento.visita3 !== rec.acompanhamento.visita3 ||
        updated.acompanhamento.visita4 !== rec.acompanhamento.visita4 ||
        updated.acompanhamento.cafeComPastor !== rec.acompanhamento.cafeComPastor
      ) {
        hasChanges = true;
      }
      return updated;
    });

    if (hasChanges || !raw) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(synced));
    }
    return synced;
  } catch (e) {
    console.error('Error reading records from localStorage', e);
    return INITIAL_RECORDS;
  }
}

export function saveStoredRecord(record: RegistrationRecord): RegistrationRecord[] {
  const records = getStoredRecords();
  const existingIndex = records.findIndex((r) => r.id === record.id);
  let updated: RegistrationRecord[];
  
  if (existingIndex >= 0) {
    updated = records.map((r) => (r.id === record.id ? record : r));
  } else {
    updated = [record, ...records];
  }
  
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  // Sync to Cloud Firestore in background
  syncRecordToCloud(record).catch(console.error);
  return updated;
}

export function deleteStoredRecord(id: string): RegistrationRecord[] {
  const records = getStoredRecords();
  const updated = records.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  // Delete from Cloud Firestore in background
  deleteRecordFromCloud(id).catch(console.error);
  return updated;
}

// --- VERSES CRUD ---
export function getStoredVerses(): BibleVerse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VERSES);
    let parsed: BibleVerse[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) parsed = [];

    // Filter out old legacy 'v-' verses
    parsed = parsed.filter((v: any) => !v.id?.startsWith('v-'));

    // Synchronize or seed INITIAL_VERSES
    let hasChanges = false;
    INITIAL_VERSES.forEach((iv) => {
      const idx = parsed.findIndex((v) => v.id === iv.id);
      if (idx === -1) {
        parsed.unshift(iv);
        hasChanges = true;
      } else if (parsed[idx].texto !== iv.texto && iv.id === 'msg-4-cafe') {
        parsed[idx] = { ...parsed[idx], texto: iv.texto };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.VERSES, JSON.stringify(parsed));
    }

    return parsed;
  } catch (e) {
    console.error('Error reading verses from localStorage', e);
    return INITIAL_VERSES;
  }
}

export function saveStoredVerse(verse: BibleVerse): BibleVerse[] {
  const verses = getStoredVerses();
  const existingIndex = verses.findIndex((v) => v.id === verse.id);
  let updated: BibleVerse[];
  
  if (existingIndex >= 0) {
    updated = verses.map((v) => (v.id === verse.id ? verse : v));
  } else {
    updated = [verse, ...verses];
  }
  
  localStorage.setItem(STORAGE_KEYS.VERSES, JSON.stringify(updated));
  syncVerseToCloud(verse).catch(console.error);
  return updated;
}

export function deleteStoredVerse(id: string): BibleVerse[] {
  const verses = getStoredVerses();
  const updated = verses.filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEYS.VERSES, JSON.stringify(updated));
  deleteVerseFromCloud(id).catch(console.error);
  return updated;
}

// --- SCHEDULED DISPATCHES ---
export function getStoredSchedules(): ScheduledDispatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading schedules from localStorage', e);
    return [];
  }
}

export function saveStoredSchedule(schedule: ScheduledDispatch): ScheduledDispatch[] {
  const schedules = getStoredSchedules();
  const existingIndex = schedules.findIndex((s) => s.id === schedule.id);
  let updated: ScheduledDispatch[];
  
  if (existingIndex >= 0) {
    updated = schedules.map((s) => (s.id === schedule.id ? schedule : s));
  } else {
    updated = [schedule, ...schedules];
  }
  
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));
  syncScheduleToCloud(schedule).catch(console.error);
  return updated;
}

export function deleteStoredSchedule(id: string): ScheduledDispatch[] {
  const schedules = getStoredSchedules();
  const updated = schedules.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));
  deleteScheduleFromCloud(id).catch(console.error);
  return updated;
}

export function clearAllStoredSchedules(): ScheduledDispatch[] {
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify([]));
  clearAllSchedulesFromCloud().catch(console.error);
  return [];
}

// --- SENT LOGS ---
export function getSentLogs(): SentMessageLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading logs from localStorage', e);
    return [];
  }
}

export function addSentLog(log: SentMessageLog): void {
  const logs = getSentLogs();
  const updated = [log, ...logs];
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated.slice(0, 500)));
  syncLogToCloud(log).catch(console.error);
}

export function clearAllSentLogs(): SentMessageLog[] {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
  clearAllLogsFromCloud().catch(console.error);
  return [];
}

export function recordMessageSentForPerson(
  recipientIdentifier: string,
  log: SentMessageLog
): RegistrationRecord | null {
  addSentLog(log);
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const records: RegistrationRecord[] = raw ? JSON.parse(raw) : INITIAL_RECORDS;
    const cleanTargetPhone = cleanPhoneNumber(recipientIdentifier);
    const lowerTarget = recipientIdentifier.toLowerCase().trim();

    const targetIdx = records.findIndex((r) => {
      if (r.id === recipientIdentifier) return true;
      const cleanPhone = cleanPhoneNumber(r.telemovel || '');
      if (
        cleanTargetPhone &&
        cleanPhone &&
        (cleanPhone === cleanTargetPhone ||
          cleanPhone.includes(cleanTargetPhone) ||
          cleanTargetPhone.includes(cleanPhone))
      ) {
        return true;
      }
      if (r.email && r.email.toLowerCase().trim() === lowerTarget) return true;
      const fullName = `${r.nome} ${r.sobrenome}`.toLowerCase().trim();
      if (fullName === lowerTarget) return true;
      return false;
    });

    if (targetIdx >= 0) {
      const logs = getSentLogs();
      const updated = syncRecordWithSentMessages(records[targetIdx], logs);
      records[targetIdx] = updated;
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
      syncRecordToCloud(updated).catch(console.error);
      return updated;
    }
  } catch (e) {
    console.error('Error updating record after message send:', e);
  }
  return null;
}

// --- SAVED MESSAGE TEMPLATES CRUD ---
export const DEFAULT_SAVED_TEMPLATES: SavedMessageTemplate[] = [
  {
    id: 'tmpl-default-wa',
    nome: 'Bênção & Versículo Semanal (Padrão)',
    texto: DEFAULT_WHATSAPP_TEMPLATE,
    canal: 'whatsapp',
    createdAt: '2026-08-27T10:00:00Z',
  },
  {
    id: 'tmpl-welcome-1st',
    nome: 'Boas-Vindas à 1ª Visita',
    texto: `A Paz do Senhor, {nome}! ✨ Seja muito bem-vindo(a) à AD Leiria!

Foi um privilégio imenso ter a tua presença na nossa celebração.

📖 *{referencia}*
"{versiculo}"

{reflexao}

A nossa igreja é a tua casa. Se precisares de apoio pastoral ou de oração, estamos ao teu lado! 🙏
_Ministério Integrarte • AD Leiria_`,
    canal: 'whatsapp',
    createdAt: '2026-08-27T10:00:00Z',
  },
  {
    id: 'tmpl-sunday-invite',
    nome: 'Convite Especial para Domingo',
    texto: `Graça e paz, {nome}! ⛪
Passando para te desejar um final de semana muito abençoado e convidar-te para a nossa celebração neste Domingo (10h e 17h).

"{versiculo}"
— {referencia}

Traz a tua família, será um culto precioso na presença do Senhor! 🙏
_AD Leiria_`,
    canal: 'ambos',
    createdAt: '2026-08-27T10:00:00Z',
  },
];

export function getSavedTemplates(): SavedMessageTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_TEMPLATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SAVED_TEMPLATES, JSON.stringify(DEFAULT_SAVED_TEMPLATES));
      return DEFAULT_SAVED_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading saved templates', e);
    return DEFAULT_SAVED_TEMPLATES;
  }
}

export function saveMessageTemplate(nome: string, texto: string, canal: 'whatsapp' | 'email' | 'ambos' = 'ambos'): SavedMessageTemplate[] {
  const templates = getSavedTemplates();
  const newTemplate: SavedMessageTemplate = {
    id: 'tmpl-' + Date.now().toString(36),
    nome: nome.trim() || 'Modelo ' + new Date().toLocaleDateString('pt-PT'),
    texto: texto.trim(),
    canal,
    createdAt: new Date().toISOString(),
  };
  const updated = [newTemplate, ...templates];
  localStorage.setItem(STORAGE_KEYS.SAVED_TEMPLATES, JSON.stringify(updated));
  return updated;
}

export function deleteSavedTemplate(id: string): SavedMessageTemplate[] {
  const templates = getSavedTemplates();
  const updated = templates.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.SAVED_TEMPLATES, JSON.stringify(updated));
  return updated;
}

export function getActiveDraftTemplate(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT);
    return raw || DEFAULT_WHATSAPP_TEMPLATE;
  } catch {
    return DEFAULT_WHATSAPP_TEMPLATE;
  }
}

export function saveActiveDraftTemplate(template: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT, template);
  } catch (e) {
    console.warn('Error saving draft template', e);
  }
}

export function getStoredDefaultMessage(): string {
  try {
    const custom = localStorage.getItem(STORAGE_KEYS.DEFAULT_USER_MESSAGE);
    if (custom !== null) {
      return custom;
    }
    const draft = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT);
    if (draft !== null) {
      return draft;
    }
    return DEFAULT_WHATSAPP_TEMPLATE;
  } catch {
    return DEFAULT_WHATSAPP_TEMPLATE;
  }
}

export function saveStoredDefaultMessage(message: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEFAULT_USER_MESSAGE, message);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT, message);
    syncDefaultMessageToCloud(message).catch(console.warn);
  } catch (e) {
    console.warn('Error saving default user message', e);
  }
}

export function resetStoredDefaultMessage(): string {
  try {
    localStorage.removeItem(STORAGE_KEYS.DEFAULT_USER_MESSAGE);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT, DEFAULT_WHATSAPP_TEMPLATE);
    syncDefaultMessageToCloud(DEFAULT_WHATSAPP_TEMPLATE).catch(console.warn);
    return DEFAULT_WHATSAPP_TEMPLATE;
  } catch {
    return DEFAULT_WHATSAPP_TEMPLATE;
  }
}

// --- SAVED VOICE RECORDINGS CRUD ---
export function getSavedVoiceRecordings(): SavedVoiceRecording[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_VOICE_RECORDINGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading saved voice recordings', e);
    return [];
  }
}

export function saveVoiceRecording(
  nome: string,
  audioBase64: string,
  duracaoSegundos: number,
  transcricaoTexto?: string,
  autor?: string
): SavedVoiceRecording[] {
  const list = getSavedVoiceRecordings();
  const newRec: SavedVoiceRecording = {
    id: 'voice-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nome: nome.trim() || `Gravação de Voz (${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })})`,
    audioBase64,
    duracaoSegundos: Math.max(1, duracaoSegundos),
    createdAt: new Date().toISOString(),
    transcricaoTexto: transcricaoTexto?.trim() || '',
    autor: autor || 'Ministério Integrarte',
  };
  const updated = [newRec, ...list].slice(0, 50); // Keep up to 50 recordings
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_VOICE_RECORDINGS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save recording to localStorage (quota exceeded), pruning older recordings...', e);
    // If quota exceeded, prune oldest recordings
    const pruned = [newRec, ...list.slice(0, 10)];
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_VOICE_RECORDINGS, JSON.stringify(pruned));
    } catch {
      // ignore
    }
  }
  return updated;
}

export function deleteVoiceRecording(id: string): SavedVoiceRecording[] {
  const list = getSavedVoiceRecordings();
  const updated = list.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_VOICE_RECORDINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error updating saved voice recordings', e);
  }
  return updated;
}

export function updateVoiceRecordingTranscript(id: string, transcricaoTexto: string): SavedVoiceRecording[] {
  const list = getSavedVoiceRecordings();
  const updated = list.map((r) => (r.id === id ? { ...r, transcricaoTexto: transcricaoTexto.trim() } : r));
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_VOICE_RECORDINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error updating voice recording transcript', e);
  }
  return updated;
}

// --- AUTOMATED SCHEDULER ENGINE ---
/**
 * Accurately checks whether a scheduled date & time is reached in Portugal local timezone.
 */
export function isScheduleDue(dataProgramada: string, horaProgramada: string): boolean {
  if (!dataProgramada) return false;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentYMD = `${year}-${month}-${day}`;

  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;

  const targetTime = (horaProgramada || '00:00').trim();

  if (dataProgramada < currentYMD) {
    return true;
  }
  if (dataProgramada === currentYMD && targetTime <= currentTime) {
    return true;
  }
  return false;
}

/**
 * Real background automated processor for due schedules.
 * - When a user-approved schedule arrives at its due time, it sends automatically!
 * - If Direct Gateway is configured (WhatsApp API / Email API), dispatches automatically via HTTP API and records logs.
 * - If in browser-only WhatsApp Web mode, notifies the user and readies the dispatch queue.
 */
export async function checkAndProcessDueSchedulesAsync(): Promise<{
  triggered: ScheduledDispatch[];
  newLogs: SentMessageLog[];
  needsManualWhatsAppWeb: ScheduledDispatch[];
}> {
  const schedules = getStoredSchedules();
  const records = getStoredRecords();
  const gatewayConfig = getDirectGatewayConfig();

  const hasDirectWhatsApp = Boolean(
    gatewayConfig.whatsappGatewayUrl && gatewayConfig.whatsappGatewayUrl.trim().startsWith('http')
  );
  const hasDirectEmail = Boolean(
    gatewayConfig.emailApiKey && gatewayConfig.emailApiKey.trim()
  );

  const dueSchedules = schedules.filter(
    (sch) => sch.status === 'agendado' && isScheduleDue(sch.dataProgramada, sch.horaProgramada)
  );

  if (dueSchedules.length === 0) {
    return { triggered: [], newLogs: [], needsManualWhatsAppWeb: [] };
  }

  const triggered: ScheduledDispatch[] = [];
  const newLogs: SentMessageLog[] = [];
  const needsManualWhatsAppWeb: ScheduledDispatch[] = [];

  for (const sch of dueSchedules) {
    const recipients = getRecipientsForAudience(records, sch.targetAudience, sch.selectedPersonIds);

    if (recipients.length === 0) {
      const updatedSch: ScheduledDispatch = {
        ...sch,
        status: 'concluido',
        enviadosSucesso: 0,
        motivoFalha: 'Nenhum destinatário encontrado para o público configurado.',
      };
      saveStoredSchedule(updatedSch);
      triggered.push(updatedSch);
      continue;
    }

    const useWhatsAppChannel = sch.canais.includes('whatsapp');
    const useEmailChannel = sch.canais.includes('email');

    // If Direct Gateway is active, execute fully automated sending
    if ((useWhatsAppChannel && hasDirectWhatsApp) || (useEmailChannel && hasDirectEmail)) {
      let successCount = 0;
      let failureReason = '';

      for (const rec of recipients) {
        const textFormatted = replacePlaceholders(
          sch.mensagemTemplate,
          rec,
          sch.verseReferencia,
          sch.verseTexto
        );

        // 1. Direct WhatsApp
        if (useWhatsAppChannel && hasDirectWhatsApp && rec.telemovel) {
          const res = await sendDirectWhatsAppMessage(rec.telemovel, textFormatted, gatewayConfig, rec.nome);
          const logItem: SentMessageLog = {
            id: 'log-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            scheduledDispatchId: sch.id,
            tipo: 'whatsapp',
            destinatarioNome: `${rec.nome} ${rec.sobrenome}`.trim(),
            destinatarioContacto: rec.telemovel,
            versiculoRef: sch.verseReferencia,
            conteudo: textFormatted,
            status: res.success ? 'enviado' : 'falha',
            dataEnvio: new Date().toISOString(),
            motivoFalha: res.error,
          };
          if (res.success) {
            recordMessageSentForPerson(rec.id, logItem);
            successCount++;
          } else {
            addSentLog(logItem);
            failureReason = res.error || 'Falha no envio via WhatsApp Gateway';
          }
          newLogs.push(logItem);
        }

        // 2. Direct Email
        if (useEmailChannel && hasDirectEmail && rec.email) {
          const emailSubject = `Palavra de Edificação: ${sch.verseReferencia} • AD Leiria`;
          const res = await sendDirectEmailMessage(rec.email, emailSubject, textFormatted, gatewayConfig);
          const logItem: SentMessageLog = {
            id: 'log-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            scheduledDispatchId: sch.id,
            tipo: 'email',
            destinatarioNome: `${rec.nome} ${rec.sobrenome}`.trim(),
            destinatarioContacto: rec.email,
            versiculoRef: sch.verseReferencia,
            conteudo: textFormatted,
            status: res.success ? 'enviado' : 'falha',
            dataEnvio: new Date().toISOString(),
            motivoFalha: res.error,
          };
          if (res.success) {
            recordMessageSentForPerson(rec.id, logItem);
            successCount++;
          } else {
            addSentLog(logItem);
            if (!failureReason) failureReason = res.error || 'Falha no envio via API de E-mail';
          }
          newLogs.push(logItem);
        }
      }

      const updatedSch: ScheduledDispatch = {
        ...sch,
        status: successCount > 0 ? 'concluido' : 'falha',
        enviadosSucesso: successCount,
        motivoFalha: successCount > 0 ? undefined : failureReason,
      };
      saveStoredSchedule(updatedSch);
      triggered.push(updatedSch);
    } else {
      // Direct Gateway not configured -> Readies schedule for WhatsApp Web instant execution
      const updatedSch: ScheduledDispatch = {
        ...sch,
        status: 'pendente_envio',
        motivoFalha: '⏰ Horário atingido! Clique para disparar a lista via WhatsApp Web ou Gateway.',
      };
      saveStoredSchedule(updatedSch);
      triggered.push(updatedSch);
      needsManualWhatsAppWeb.push(updatedSch);
    }
  }

  return { triggered, newLogs, needsManualWhatsAppWeb };
}

// Synchronous wrapper for compatibility
export function checkAndProcessDueSchedules(): {
  triggered: ScheduledDispatch[];
  newLogs: SentMessageLog[];
} {
  // Triggers async processing in background
  checkAndProcessDueSchedulesAsync().catch(console.error);
  return { triggered: [], newLogs: [] };
}

// Helper to filter recipients
export function getRecipientsForAudience(
  records: RegistrationRecord[],
  audience: string,
  selectedPersonIds?: string[]
): RegistrationRecord[] {
  switch (audience) {
    case 'visitantes':
      return records.filter((r) => r.decisionType === 'VISITANTE');
    case 'conversoes':
      return records.filter((r) => r.decisionType === 'CONVERSAO');
    case 'reconciliacoes':
      return records.filter((r) => r.decisionType === 'RECONCILIACAO');
    case 'personalizado':
      if (selectedPersonIds && selectedPersonIds.length > 0) {
        return records.filter((r) => selectedPersonIds.includes(r.id));
      }
      return records;
    case 'todos':
    default:
      return records;
  }
}

// Format Phone for WhatsApp
export function cleanPhoneNumber(phone: string): string {
  // Remove non digits
  let cleaned = phone.replace(/\D/g, '');
  
  // If it is Portuguese number starting with 9 and 9 digits long, prepend 351
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    cleaned = '351' + cleaned;
  }
  return cleaned;
}

export function formatWhatsAppUrl(phone: string, message: string): string {
  const clean = cleanPhoneNumber(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function formatMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function formatGmailComposeUrl(email: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function formatOutlookComposeUrl(email: string, subject: string, body: string): string {
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function formatYahooComposeUrl(email: string, subject: string, body: string): string {
  return `https://compose.mail.yahoo.com/?to=${encodeURIComponent(email)}&subj=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function replacePlaceholders(
  template: string,
  person: RegistrationRecord,
  verseRefOrVerse?: string | BibleVerse,
  verseText?: string,
  reflexao = ''
): string {
  if (!template) return '';

  let ref = '';
  let text = '';
  let refl = reflexao;

  if (typeof verseRefOrVerse === 'object' && verseRefOrVerse !== null) {
    ref = verseRefOrVerse.referencia || '';
    text = verseRefOrVerse.texto || '';
    refl = reflexao || verseRefOrVerse.reflexaoBreve || '';
  } else if (typeof verseRefOrVerse === 'string') {
    ref = verseRefOrVerse;
    text = verseText || '';
  }

  // Ensure first name is extracted cleanly
  const rawFirstName = (person?.nome || '').trim();
  const firstName = rawFirstName.split(' ')[0] || 'Estimado(a)';
  const lastName = (person?.sobrenome || '').trim();
  const fullName = `${rawFirstName} ${lastName}`.trim();

  return template
    .replace(/{(?:nome|name|first_name)}/gi, firstName)
    .replace(/\[(?:nome|name|first_name)\]/gi, firstName)
    .replace(/{(?:sobrenome|last_name)}/gi, lastName)
    .replace(/\[(?:sobrenome|last_name)\]/gi, lastName)
    .replace(/{(?:nome_completo|full_name)}/gi, fullName)
    .replace(/\[(?:nome_completo|full_name)\]/gi, fullName)
    .replace(/{referencia}/gi, ref)
    .replace(/\[referencia\]/gi, ref)
    .replace(/{versiculo}/gi, text)
    .replace(/\[versiculo\]/gi, text)
    .replace(/{reflexao}/gi, refl || 'Que esta palavra encha o teu coração de paz e esperança!')
    .replace(/\[reflexao\]/gi, refl || 'Que esta palavra encha o teu coração de paz e esperança!')
    .replace(/{igreja}/gi, 'AD Leiria - Ministério Integrarte')
    .replace(/\[igreja\]/gi, 'AD Leiria - Ministério Integrarte')
    .replace(/{data_registo}/gi, person?.dataRegisto || '')
    .replace(/{celebracao}/gi, person?.celebracaoDomingo || 'Domingo');
}

// Export Records to CSV
export function exportRecordsToCSV(records: RegistrationRecord[]): void {
  const headers = [
    'ID',
    'Data Registo',
    'Tipo Decisao',
    'Tipo Visita',
    'Nome',
    'Apelido',
    'Telemovel',
    'Email',
    'Faixa Etaria',
    'Como Conheceu',
    'Detalhe / Convidado Por',
    'Celebracao Domingo',
    'RGPD Aceite',
    'Visita 1',
    'Visita 2',
    'Visita 3',
    'Visita 4',
    'Notas Pastorais',
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.dataRegisto}"`,
    `"${r.decisionType}"`,
    `"${r.visitType}"`,
    `"${r.nome}"`,
    `"${r.sobrenome}"`,
    `"${r.telemovel}"`,
    `"${r.email}"`,
    `"${r.faixaEtaria}"`,
    `"${r.comoConheceu}"`,
    `"${r.comoConheceuDetalhe || ''}"`,
    `"${r.celebracaoDomingo}"`,
    `"${r.autorizacaoRgpd ? 'Sim' : 'Não'}"`,
    `"${r.acompanhamento.visita1 ? 'Sim' : 'Não'}"`,
    `"${r.acompanhamento.visita2 ? 'Sim' : 'Não'}"`,
    `"${r.acompanhamento.visita3 ? 'Sim' : 'Não'}"`,
    `"${r.acompanhamento.visita4 ? 'Sim' : 'Não'}"`,
    `"${(r.acompanhamento.notasPastorais || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `AD_Leiria_Registos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
