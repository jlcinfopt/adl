import React, { useState } from 'react';
import { 
  FileText, 
  QrCode, 
  Users, 
  BookOpen, 
  History, 
  ExternalLink,
  ShieldCheck,
  Lock,
  LogOut,
  UserCog,
  ChevronRight,
  BarChart3,
  Database
} from 'lucide-react';
import { AdLeiriaLogo } from './AdLeiriaLogo';
import { AppUser } from '../types';

export type ActiveTab = 'form' | 'qr' | 'records' | 'charts' | 'scheduler' | 'history' | 'users';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  recordsCount: number;
  schedulesCount: number;
  currentUser: AppUser | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  isVisitorMode?: boolean;
  onToggleVisitorMode?: () => void;
  onOpenSupabaseModal?: () => void;
  isSupabaseActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  recordsCount,
  schedulesCount,
  currentUser,
  onOpenLoginModal,
  onLogout,
  isVisitorMode = false,
  onToggleVisitorMode,
  onOpenSupabaseModal,
  isSupabaseActive = false,
}) => {
  const isSuperAdmin = currentUser?.role === 'ADMINISTRADOR' || currentUser?.username.toLowerCase() === 'administrador';


  return (
    <header className="bg-white border-b-2 border-red-600 sticky top-0 z-40 shadow-sm">
      {/* Top micro bar */}
      <div className="bg-red-600 text-white text-[11px] font-bold py-1 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AD Leiria • Ministério Integrarte
            </span>
          </div>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <span>Sessão:</span>
                <span className="bg-red-700 px-2 py-0.5 rounded text-white font-bold">
                  {currentUser.nome} ({currentUser.role === 'ADMINISTRADOR' ? 'Admin' : 'Pastor'})
                </span>
              </span>
            ) : (
              <span className="text-red-100 text-[10px]">
                Modo Visitante Ativo
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Program Name */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onSelectTab(currentUser ? 'records' : 'form')}
            title="Ficha de Registo de Visitantes Ad-Leiria"
          >
            <AdLeiriaLogo size={46} showText={true} />
            <div className="hidden md:flex flex-col border-l border-slate-200 pl-3">
              <span className="text-xs font-black tracking-tight text-slate-800 uppercase leading-none">
                Ficha de Registo de Visitantes
              </span>
              <span className="text-[10px] text-red-600 font-bold tracking-wider leading-tight mt-0.5">
                Ad-Leiria
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs (When Logged in to Administrative Panel) */}
          {currentUser ? (
            <nav className="hidden lg:flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelectTab('records')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'records'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Banco de Registos
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ml-0.5 ${
                  activeTab === 'records' ? 'bg-white text-red-700' : 'bg-red-100 text-red-700'
                }`}>
                  {recordsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('charts')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'charts'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Gráficos & Métricas
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('scheduler')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'scheduler'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Agendar Mensagens
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('history')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Histórico
                {schedulesCount > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ml-0.5 ${
                    activeTab === 'history' ? 'bg-white text-red-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {schedulesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('qr')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'qr'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Code & Link
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('form')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Ficha de Registo
              </button>

              {/* Master Administrator User Management */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => onSelectTab('users')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    activeTab === 'users'
                      ? 'bg-red-700 text-white border-red-800 shadow-xs'
                      : 'border-red-200 text-red-700 hover:bg-red-50'
                  }`}
                >
                  <UserCog className="w-3.5 h-3.5" />
                  Gerir Utilizadores
                </button>
              )}
            </nav>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ficha Digital de Acolhimento
              </span>
            </div>
          )}

          {/* Right Controls: Login / Logout & Visitor Mode Switch */}
          <div className="flex items-center gap-2.5">


            {currentUser ? (
              <div className="flex items-center gap-2">
                {onToggleVisitorMode && (
                  <button
                    type="button"
                    onClick={onToggleVisitorMode}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isVisitorMode ? 'Voltar ao Painel' : 'Visão do Visitante'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Terminar Sessão"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Painel Administrativo (Entrar)</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Horizontal Bar (When Logged in) */}
        {currentUser && (
          <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 text-xs scrollbar-none">
            <button
              type="button"
              onClick={() => onSelectTab('records')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1 ${
                activeTab === 'records' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Registos ({recordsCount})
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('charts')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1 ${
                activeTab === 'charts' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Gráficos
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('scheduler')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1 ${
                activeTab === 'scheduler' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Mensagens
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('history')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1 ${
                activeTab === 'history' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Histórico ({schedulesCount})
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('qr')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1 ${
                activeTab === 'qr' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> QR Code
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('form')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1 ${
                activeTab === 'form' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Ficha
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => onSelectTab('users')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1 ${
                  activeTab === 'users' ? 'bg-red-700 text-white' : 'text-red-700 font-bold bg-red-50'
                }`}
              >
                <UserCog className="w-3.5 h-3.5" /> Utilizadores
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
