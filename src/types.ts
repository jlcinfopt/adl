export type DecisionType = 'VISITANTE' | 'CONVERSAO' | 'RECONCILIACAO';
export type VisitType = '1a_visita' | '2a_3a_visita';
export type AgeRange = '12 a 17 anos' | '18 a 35 anos' | '35 anos acima';
export type HowMetChurch = 
  | 'Instagram' 
  | 'Facebook' 
  | 'Website' 
  | 'Google' 
  | 'Evangelismo de rua' 
  | 'Por intermédio de alguém' 
  | 'Outra (especifique)';

export type CelebrationService = '10h' | '17h' | '21h' | 'Outro';

export interface PastoralFollowUp {
  visita1: boolean;
  visita2: boolean;
  visita3: boolean;
  visita4: boolean;
  cafeComPastor?: boolean;
  dataCafeComPastor?: string;
  horaCafeComPastor?: string;
  localCafeComPastor?: string;
  statusCafeComPastor?: 'marcado' | 'realizado' | 'cancelado';
  notasPastorais: string;
  responsavel?: string;
  ultimaInteracao?: string;
}

export interface SentMessageLog {
  id: string;
  scheduledDispatchId?: string;
  tipo: 'whatsapp' | 'email';
  versiculoRef: string;
  conteudo: string;
  dataEnvio: string;
  status: 'enviado' | 'agendado' | 'falha';
  motivoFalha?: string;
  destinatarioNome: string;
  destinatarioContacto: string;
}

export interface RegistrationRecord {
  id: string;
  createdAt: string;
  decisionType: DecisionType;
  visitType: VisitType;
  nome: string;
  sobrenome: string;
  telemovel: string;
  email: string;
  faixaEtaria: AgeRange;
  comoConheceu: HowMetChurch;
  comoConheceuDetalhe?: string;
  autorizacaoRgpd: boolean;
  dataRegisto: string; // YYYY-MM-DD or DD/MM/YYYY
  celebracaoDomingo: CelebrationService;
  assinatura?: string; // signature data URL or typed name
  acompanhamento: PastoralFollowUp;
  tags?: string[];
}

export interface BibleVerse {
  id: string;
  referencia: string;
  livro: string;
  capitulo: number;
  versiculo: string;
  texto: string;
  categoria: 'Acolhimento' | string;
  reflexaoBreve?: string;
  tipo?: 'versiculo' | 'mensagem';
}

export interface SavedMessageTemplate {
  id: string;
  nome: string;
  texto: string;
  canal?: 'whatsapp' | 'email' | 'ambos';
  createdAt: string;
}

export interface SavedVoiceRecording {
  id: string;
  nome: string;
  audioBase64: string; // data URL or base64 audio
  duracaoSegundos: number;
  createdAt: string;
  transcricaoTexto?: string;
  autor?: string;
}

export type AudienceFilter = 'todos' | 'visitantes' | 'conversoes' | 'reconciliacoes' | 'visita_1' | 'personalizado';

export type UserRole = 'PASTOR' | 'ADMINISTRADOR';

export interface AppUser {
  id: string;
  username: string; // e.g. 'admin', 'administrador', 'pastor.joao'
  password: string; // plain text for local demo storage
  nome: string; // e.g. 'Pastor de Acolhimento', 'Administrador Geral'
  role: UserRole;
  cargo?: string; // e.g. 'Pastor Titular', 'Pastor Auxiliar', 'Líder de Acolhimento'
  email?: string;
  telefone?: string;
  createdAt: string;
  requiresPasswordChange?: boolean;
}

export interface AuthSession {
  user: AppUser;
  token: string;
  loginAt: string;
}

export interface ScheduledDispatch {
  id: string;
  titulo: string;
  verseId: string;
  verseReferencia: string;
  verseTexto: string;
  targetAudience: AudienceFilter;
  selectedPersonIds?: string[];
  canais: ('whatsapp' | 'email')[];
  dataProgramada: string; // YYYY-MM-DD
  horaProgramada: string; // HH:mm
  mensagemTemplate: string;
  status: 'agendado' | 'executando' | 'concluido' | 'cancelado' | 'falha' | 'pendente_envio';
  createdAt: string;
  totalDestinatarios: number;
  enviadosSucesso: number;
  enviadosFalha?: number;
  motivoFalha?: string;
  executadoEm?: string;
  logs?: SentMessageLog[];
}
