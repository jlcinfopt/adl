import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RegistrationRecord, BibleVerse, ScheduledDispatch, SentMessageLog, AppUser } from './types';

// Read Vite client environment variables
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  urlPreview: string;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  const hasUrl = Boolean(
    supabaseUrl && 
    supabaseUrl.startsWith('http') && 
    !supabaseUrl.includes('seu-projeto')
  );
  const hasAnonKey = Boolean(
    supabaseAnonKey && 
    supabaseAnonKey.length > 20 && 
    !supabaseAnonKey.includes('sua-chave')
  );

  return {
    isConfigured: hasUrl && hasAnonKey,
    hasUrl,
    hasAnonKey,
    urlPreview: hasUrl ? supabaseUrl : '',
  };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfigStatus().isConfigured;
};

let cachedClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!cachedClient) {
    try {
      cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Erro ao inicializar Supabase Client:', err);
      return null;
    }
  }
  return cachedClient;
};

// --- SUPABASE CRUD OPERATIONS ---

// 1. RECORDS
export async function fetchSupabaseRecords(): Promise<RegistrationRecord[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar registos no Supabase:', error);
      return null;
    }
    return (data || []).map((row: any) => ({
      ...row.data,
      id: row.id || row.data?.id,
    })) as RegistrationRecord[];
  } catch (err) {
    console.error('Falha de rede Supabase records:', err);
    return null;
  }
}

export async function upsertSupabaseRecord(record: RegistrationRecord): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('records').upsert({
      id: record.id,
      nome: record.nome,
      sobrenome: record.sobrenome,
      telemovel: record.telemovel,
      email: record.email,
      decision_type: record.decisionType,
      data_registo: record.dataRegisto,
      celebracao: record.celebracaoDomingo,
      data: record,
      created_at: record.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error('Erro ao salvar registo no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao salvar no Supabase:', err);
    return false;
  }
}

export async function deleteSupabaseRecord(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('records').delete().eq('id', id);
    if (error) {
      console.error('Erro ao eliminar registo no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao eliminar no Supabase:', err);
    return false;
  }
}

// 2. VERSES
export async function fetchSupabaseVerses(): Promise<BibleVerse[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.from('verses').select('*');
    if (error) {
      console.error('Erro ao buscar versículos no Supabase:', error);
      return null;
    }
    return (data || []).map((row: any) => ({
      ...row.data,
      id: row.id || row.data?.id,
    })) as BibleVerse[];
  } catch (err) {
    console.error('Falha de rede Supabase verses:', err);
    return null;
  }
}

export async function upsertSupabaseVerse(verse: BibleVerse): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('verses').upsert({
      id: verse.id,
      referencia: verse.referencia,
      categoria: verse.categoria,
      data: verse,
    });
    if (error) {
      console.error('Erro ao salvar versículo no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao salvar versículo no Supabase:', err);
    return false;
  }
}

export async function deleteSupabaseVerse(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('verses').delete().eq('id', id);
    if (error) {
      console.error('Erro ao eliminar versículo no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao eliminar versículo no Supabase:', err);
    return false;
  }
}

// 3. SCHEDULES
export async function fetchSupabaseSchedules(): Promise<ScheduledDispatch[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar agendamentos no Supabase:', error);
      return null;
    }
    return (data || []).map((row: any) => ({
      ...row.data,
      id: row.id || row.data?.id,
    })) as ScheduledDispatch[];
  } catch (err) {
    console.error('Falha de rede Supabase schedules:', err);
    return null;
  }
}

export async function upsertSupabaseSchedule(schedule: ScheduledDispatch): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('schedules').upsert({
      id: schedule.id,
      titulo: schedule.titulo,
      data_programada: schedule.dataProgramada,
      status: schedule.status,
      data: schedule,
      created_at: schedule.createdAt || new Date().toISOString(),
    });
    if (error) {
      console.error('Erro ao salvar agendamento no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao salvar agendamento no Supabase:', err);
    return false;
  }
}

export async function deleteSupabaseSchedule(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('schedules').delete().eq('id', id);
    if (error) {
      console.error('Erro ao eliminar agendamento no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao eliminar agendamento no Supabase:', err);
    return false;
  }
}

// 4. LOGS
export async function fetchSupabaseLogs(): Promise<SentMessageLog[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar logs no Supabase:', error);
      return null;
    }
    return (data || []).map((row: any) => ({
      ...row.data,
      id: row.id || row.data?.id,
    })) as SentMessageLog[];
  } catch (err) {
    console.error('Falha de rede Supabase logs:', err);
    return null;
  }
}

export async function upsertSupabaseLog(log: SentMessageLog): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('logs').upsert({
      id: log.id,
      tipo: log.tipo,
      destinatario_nome: log.destinatarioNome,
      destinatario_contacto: log.destinatarioContacto,
      data_envio: log.dataEnvio,
      data: log,
      created_at: log.dataEnvio ? new Date(log.dataEnvio).toISOString() : new Date().toISOString(),
    });
    if (error) {
      console.error('Erro ao salvar log no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao salvar log no Supabase:', err);
    return false;
  }
}

// 5. USERS
export async function fetchSupabaseUsers(): Promise<AppUser[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.from('users').select('*');
    if (error) {
      console.error('Erro ao buscar utilizadores no Supabase:', error);
      return null;
    }
    return (data || []).map((row: any) => ({
      ...row.data,
      id: row.id || row.data?.id,
    })) as AppUser[];
  } catch (err) {
    console.error('Falha de rede Supabase users:', err);
    return null;
  }
}

export async function upsertSupabaseUser(user: AppUser): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('users').upsert({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      data: user,
    });
    if (error) {
      console.error('Erro ao salvar utilizador no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao salvar utilizador no Supabase:', err);
    return false;
  }
}

// --- REALTIME LISTENERS VIA SUPABASE CHANNELS ---

export function subscribeToSupabaseTable(
  tableName: 'records' | 'verses' | 'schedules' | 'logs' | 'users',
  onChange: () => void
): () => void {
  const client = getSupabase();
  if (!client) return () => {};

  const channel = client
    .channel(`public:${tableName}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
