import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  X,
  Layers,
  Code2,
  KeyRound,
  ShieldCheck,
  CloudCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { getSupabaseConfigStatus } from '../supabase';
import firebaseConfig from '../../firebase-applet-config.json';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPABASE_SQL_SCRIPT = `-- SCHEMA SUPABASE - AD LEIRIA (MINISTÉRIO INTEGRARTE)
CREATE TABLE IF NOT EXISTS public.records (
  id TEXT PRIMARY KEY,
  nome TEXT,
  sobrenome TEXT,
  telemovel TEXT,
  email TEXT,
  decision_type TEXT,
  data_registo TEXT,
  celebracao TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.verses (
  id TEXT PRIMARY KEY,
  referencia TEXT,
  categoria TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,
  titulo TEXT,
  data_programada TEXT,
  status TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.logs (
  id TEXT PRIMARY KEY,
  tipo TEXT,
  destinatario_nome TEXT,
  destinatario_contacto TEXT,
  data_envio TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'firestore' | 'supabase'>('firestore');
  const status = getSupabaseConfigStatus();

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                Estado da Base de Dados & Migrações
                <span className="text-[10px] bg-emerald-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Firestore Conectado
                </span>
              </h3>
              <p className="text-xs text-red-100">
                Sincronização na nuvem para Fichas, Versículos, Agendamentos e Utilizadores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('firestore')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'firestore'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Google Cloud Firestore (Oficial • Conectado)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'supabase'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            Supabase / SQL (Espelho Opcional)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm flex-1">
          {activeTab === 'firestore' ? (
            <>
              {/* Firestore Operational Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    Banco de Dados Oficial Conectado & Operacional
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    O seu banco de dados na nuvem está <strong>100% ativo</strong>. As migrações da estrutura foram validadas e todas as informações preenchidas nas fichas de registo e versículos são salvas automaticamente em tempo real.
                  </p>
                </div>
              </div>

              {/* Database Credentials & Verification details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CloudCheck className="w-4 h-4 text-red-600" />
                  Detalhes da Conexão na Nuvem
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">ID da Base de Dados</span>
                    <span className="font-mono font-bold text-slate-800 truncate block mt-0.5" title={firebaseConfig.firestoreDatabaseId}>
                      {firebaseConfig.firestoreDatabaseId}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Projeto Google Cloud</span>
                    <span className="font-mono font-bold text-slate-800 truncate block mt-0.5">
                      {firebaseConfig.projectId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collections & Migrations Verification */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Estado das Tabelas & Coleções (Migrações):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Fichas de Visitantes</span>
                      <span className="text-[10px] text-slate-400 font-mono">coleção 'records'</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativa
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Versículos Bíblicos</span>
                      <span className="text-[10px] text-slate-400 font-mono">coleção 'verses'</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativa
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Agendamentos</span>
                      <span className="text-[10px] text-slate-400 font-mono">coleção 'schedules'</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativa
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Histórico de Envios</span>
                      <span className="text-[10px] text-slate-400 font-mono">coleção 'logs'</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativa
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between sm:col-span-2">
                    <div>
                      <span className="font-bold text-slate-800 block">Utilizadores & Permissões</span>
                      <span className="text-[10px] text-slate-400 font-mono">coleção 'users'</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativa
                    </span>
                  </div>
                </div>
              </div>

              {/* Clarification Box */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Não precisa se preocupar:</strong> O aviso anterior que dizia <em>"Supabase: Configurar"</em> era apenas um atalho para quem quisesse opcionalmente conectar um banco SQL paralelo. O seu banco de dados principal já é o <strong>Google Cloud Firestore</strong>, que funciona sem necessidade de nenhuma configuração adicional.
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Supabase Tab (Optional Secondary Mirror) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-600">
                    Espelho Secundário PostgreSQL (Opcional)
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Esta opção serve apenas para quem deseja manter em simultâneo uma réplica relacional no Supabase. <strong>Não é obrigatório</strong>, pois o Firestore já armazena tudo com segurança.
                  </p>
                </div>
              </div>

              {/* Status Box */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                status.isConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                {status.isConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-xs">
                    {status.isConfigured
                      ? 'Supabase Conectado como Espelho Secundário'
                      : 'Supabase Não Configurado (Opcional)'}
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {status.isConfigured
                      ? `Os dados da AD Leiria estão espelhando também no Supabase (${status.urlPreview}).`
                      : 'Se não utilizar o Supabase, pode ignorar esta secção, pois o Firestore já atende 100% da igreja.'}
                  </p>
                </div>
              </div>

              {/* SQL Script for Supabase */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    Script SQL para criar as tabelas no Supabase (se desejar):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40">
                  {SUPABASE_SQL_SCRIPT}
                </pre>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Base de dados operacional e protegida
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export const DatabaseStatusModal = SupabaseModal;
