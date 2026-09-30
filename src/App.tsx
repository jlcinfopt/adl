import React, { useEffect, useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { RegistrationForm } from './components/RegistrationForm';
import { QRCodeHub } from './components/QRCodeHub';
import { RecordsList } from './components/RecordsList';
import { ChurchCharts } from './components/ChurchCharts';
import { VerseScheduler } from './components/VerseScheduler';
import { DispatchHistory } from './components/DispatchHistory';
import { UserManagement } from './components/UserManagement';
import { SystemReportModal } from './components/SystemReportModal';
import { LoginModal } from './components/LoginModal';
import { ForceChangePasswordModal } from './components/ForceChangePasswordModal';
import { SupabaseModal } from './components/SupabaseModal';
import { CoffeeConfirmationPublicForm } from './components/CoffeeConfirmationPublicForm';
import { AdLeiriaLogo } from './components/AdLeiriaLogo';
import { 
  getStoredRecords, 
  getStoredSchedules, 
  getSentLogs, 
  checkAndProcessDueSchedulesAsync,
  syncRecordWithSentMessages
} from './utils/storage';
import {
  subscribeToRecords,
  subscribeToSchedules,
  subscribeToLogs,
  subscribeToUsers,
  subscribeToGatewayConfig,
} from './utils/cloudSync';
import { applyCloudGatewayConfig } from './utils/directSender';
import { getCurrentSession, logoutUser, saveStoredUsers } from './utils/authStorage';
import { RegistrationRecord, ScheduledDispatch, SentMessageLog, AppUser } from './types';
import { CheckCircle2, Lock, ShieldCheck, ArrowRight, Cloud, CloudCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const session = getCurrentSession();
    return session?.user || null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isSystemReportOpen, setIsSystemReportOpen] = useState(false);
  const [forcedChangeUser, setForcedChangeUser] = useState<AppUser | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const session = getCurrentSession();
    return session?.user ? 'records' : 'form';
  });
  const [isVisitorMode, setIsVisitorMode] = useState(false);
  const [isCafeMode, setIsCafeMode] = useState(false);
  const [records, setRecords] = useState<RegistrationRecord[]>(getStoredRecords);
  const [schedules, setSchedules] = useState<ScheduledDispatch[]>(getStoredSchedules);
  const [logs, setLogs] = useState<SentMessageLog[]>(getSentLogs);
  const [preSelectedForVerse, setPreSelectedForVerse] = useState<RegistrationRecord[]>([]);
  const [autoNotification, setAutoNotification] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(true);

  // Check URL parameters on mount (?view=form or ?view=cafe)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'form') {
      setIsVisitorMode(true);
      setActiveTab('form');
    } else if (params.get('view') === 'cafe' || params.get('cafe') === 'true') {
      setIsCafeMode(true);
    }
  }, []);

  // Real-time Cloud Subscriptions across all computers / phones
  useEffect(() => {
    const unsubRecords = subscribeToRecords((cloudRecords) => {
      const currentLogs = getSentLogs();
      const synced = cloudRecords.map((r) => syncRecordWithSentMessages(r, currentLogs));
      setRecords(synced);
      localStorage.setItem('adleiria_registration_records_v1', JSON.stringify(synced));
    });

    const unsubSchedules = subscribeToSchedules((cloudSchedules) => {
      setSchedules(cloudSchedules);
      localStorage.setItem('adleiria_scheduled_dispatches_v1', JSON.stringify(cloudSchedules));
    });

    const unsubLogs = subscribeToLogs((cloudLogs) => {
      setLogs(cloudLogs);
      localStorage.setItem('adleiria_sent_message_logs_v1', JSON.stringify(cloudLogs));
      setRecords((prev) => prev.map((r) => syncRecordWithSentMessages(r, cloudLogs)));
    });

    const unsubUsers = subscribeToUsers((cloudUsers) => {
      saveStoredUsers(cloudUsers);
    });

    const unsubGateway = subscribeToGatewayConfig((cloudGateway) => {
      applyCloudGatewayConfig(cloudGateway);
    });

    return () => {
      unsubRecords();
      unsubSchedules();
      unsubLogs();
      unsubUsers();
      unsubGateway();
    };
  }, []);

  // Background automated scheduler worker (runs immediately on mount and every 20 seconds)
  useEffect(() => {
    let isMounted = true;

    const runWorker = async () => {
      try {
        const result = await checkAndProcessDueSchedulesAsync();
        if (!isMounted) return;

        if (result.triggered.length > 0 || (result.newLogs && result.newLogs.length > 0)) {
          setSchedules(getStoredSchedules());
          setLogs(getSentLogs());
          setRecords(getStoredRecords());

          if (result.needsManualWhatsAppWeb && result.needsManualWhatsAppWeb.length > 0) {
            const firstPending = result.needsManualWhatsAppWeb[0];
            setAutoNotification(
              `⏰ Horário atingido para o envio agendado: "${firstPending.titulo}". Clique na aba "Programações & Histórico" para disparar via WhatsApp Web ou Gateway.`
            );
            setTimeout(() => {
              if (isMounted) setAutoNotification(null);
            }, 10000);
          } else if (result.triggered.length > 0) {
            const firstExecuted = result.triggered[0];
            if (firstExecuted.enviadosSucesso && firstExecuted.enviadosSucesso > 0) {
              setAutoNotification(
                `✨ Envio Automático Concluído: "${firstExecuted.titulo}" entregue a ${firstExecuted.enviadosSucesso} pessoa(s) com sucesso!`
              );
            } else if (firstExecuted.status === 'falha') {
              setAutoNotification(
                `⚠️ Falha no envio agendado "${firstExecuted.titulo}": ${firstExecuted.motivoFalha || 'Verifique as credenciais do Gateway no menu ⚙️'}`
              );
            }
            setTimeout(() => {
              if (isMounted) setAutoNotification(null);
            }, 9000);
          }
        }
      } catch (err) {
        console.error('Error running automated scheduler worker:', err);
      }
    };

    // Run immediately on load
    runWorker();

    // Repeat every 20 seconds
    const interval = setInterval(runWorker, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const refreshAllData = () => {
    setRecords(getStoredRecords());
    setSchedules(getStoredSchedules());
    setLogs(getSentLogs());
    const session = getCurrentSession();
    if (session?.user) {
      setCurrentUser(session.user);
    }
  };

  const handleLoginSuccess = (user: AppUser) => {
    setIsLoginModalOpen(false);
    if (user.requiresPasswordChange) {
      setForcedChangeUser(user);
    } else {
      setCurrentUser(user);
      setActiveTab('records');
    }
  };

  const handleForcedPasswordUpdated = (updatedUser: AppUser) => {
    setForcedChangeUser(null);
    setCurrentUser(updatedUser);
    setActiveTab('records');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActiveTab('form');
  };

  const handleTabChange = (tab: ActiveTab) => {
    // If selecting protected pastoral tabs and not logged in, prompt login
    if (!currentUser && (tab === 'records' || tab === 'scheduler' || tab === 'history' || tab === 'users')) {
      setIsLoginModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleNewRecordSuccess = (_newRec: RegistrationRecord) => {
    refreshAllData();
  };

  const handleSelectRecordsForVerse = (selected: RegistrationRecord[]) => {
    setPreSelectedForVerse(selected);
    setActiveTab('scheduler');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccessLogin={handleLoginSuccess}
      />

      {/* Force Change Password Modal upon first login */}
      {forcedChangeUser && (
        <ForceChangePasswordModal
          currentUser={forcedChangeUser}
          onSuccessUpdated={handleForcedPasswordUpdated}
        />
      )}

      {/* Database Status & Supabase SQL Migration Modal */}
      <SupabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
      />

      {/* If in public Coffee Confirmation Form Mode (?view=cafe) */}
      {isCafeMode ? (
        <CoffeeConfirmationPublicForm
          onBackToApp={() => {
            setIsCafeMode(false);
            if (!currentUser) {
              setIsLoginModalOpen(true);
            } else {
              setActiveTab('records');
            }
          }}
        />
      ) : isVisitorMode ? (
        <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
          <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-red-100 shadow-xs">
            <AdLeiriaLogo size={42} showText={true} />
            
            <button
              type="button"
              onClick={() => {
                setIsVisitorMode(false);
                if (!currentUser) {
                  setIsLoginModalOpen(true);
                } else {
                  setActiveTab('records');
                }
              }}
              className="text-xs text-red-700 font-bold hover:bg-red-50 bg-white px-4 py-2 rounded-xl border border-red-200 shadow-2xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-red-600" />
              <span>Aceder ao Painel Administrativo →</span>
            </button>
          </div>

          <RegistrationForm
            isStandalone={true}
            onSuccess={handleNewRecordSuccess}
            onOpenQRModal={() => {
              setIsVisitorMode(false);
              setActiveTab('qr');
            }}
          />
        </div>
      ) : (
        /* Full Administrative & Pastoral Management Experience */
        <>
          <Navbar
            activeTab={activeTab}
            onSelectTab={handleTabChange}
            recordsCount={records.length}
            schedulesCount={schedules.filter((s) => s.status === 'agendado').length}
            currentUser={currentUser}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onOpenSupabaseModal={() => setIsDatabaseModalOpen(true)}
            onLogout={handleLogout}
            isVisitorMode={isVisitorMode}
            onToggleVisitorMode={() => setIsVisitorMode(!isVisitorMode)}
          />

          {/* Automated Trigger Notification Toast */}
          {autoNotification && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
              <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Sistema Automático de Versículos</h4>
                    <p className="text-xs text-emerald-100">{autoNotification}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoNotification(null)}
                  className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* Main Workspace Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {activeTab === 'form' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <RegistrationForm
                  onSuccess={handleNewRecordSuccess}
                  onOpenQRModal={() => setActiveTab('qr')}
                />
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="animate-in fade-in duration-200">
                <QRCodeHub onOpenFormDirectly={() => setIsVisitorMode(true)} />
              </div>
            )}

            {/* Protected Tab: Records */}
            {activeTab === 'records' && (
              currentUser ? (
                <div className="animate-in fade-in duration-200">
                  <RecordsList
                    records={records}
                    logs={logs}
                    onUpdateRecords={refreshAllData}
                    onSelectForVerseDispatch={handleSelectRecordsForVerse}
                    onOpenNewForm={() => setActiveTab('form')}
                    onOpenCharts={() => setActiveTab('charts')}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm border border-red-100 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Acesso Pastoral Restrito</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Para visualizar e gerir o banco de registos de visitantes e decisões, inicie sessão com as credenciais pastorais.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Iniciar Sessão no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )
            )}

            {/* Protected Tab: Charts & Analytics */}
            {activeTab === 'charts' && (
              currentUser ? (
                <div className="animate-in fade-in duration-200">
                  <ChurchCharts
                    records={records}
                    logs={logs}
                    onOpenRecordsTab={() => setActiveTab('records')}
                    onUpdateRecords={refreshAllData}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm border border-red-100 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Acesso Pastoral Restrito</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Para visualizar os gráficos e métricas pastorais de integração e decisões, inicie sessão com as credenciais pastorais.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Iniciar Sessão no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )
            )}

            {/* Protected Tab: Verse Scheduler */}
            {activeTab === 'scheduler' && (
              currentUser ? (
                <div className="animate-in fade-in duration-200">
                  <VerseScheduler
                    records={records}
                    preSelectedRecords={preSelectedForVerse}
                    onScheduleCreated={refreshAllData}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto shadow-sm border border-red-100 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Acesso Restrito</h3>
                  <p className="text-xs text-slate-600">
                    Inicie sessão para programar e disparar mensagens com versículos bíblicos.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Entrar no Painel Administrativo
                  </button>
                </div>
              )
            )}

            {/* Protected Tab: Dispatch History */}
            {activeTab === 'history' && (
              currentUser ? (
                <div className="animate-in fade-in duration-200">
                  <DispatchHistory
                    schedules={schedules}
                    logs={logs}
                    records={records}
                    onRefresh={refreshAllData}
                    onOpenSchedulerTab={() => setActiveTab('scheduler')}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto shadow-sm border border-red-100 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Histórico de Mensagens</h3>
                  <p className="text-xs text-slate-600">
                    Inicie sessão para visualizar os registos de envio de mensagens.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Entrar no Painel Administrativo
                  </button>
                </div>
              )
            )}

            {/* Protected Tab: Master Admin User Management */}
            {activeTab === 'users' && currentUser && (
              <div className="animate-in fade-in duration-200">
                <UserManagement
                  currentUser={currentUser}
                  onUsersUpdated={refreshAllData}
                />
              </div>
            )}
          </main>

          {/* Footer with Official AD Leiria Logo and Branding */}
          <footer className="bg-white border-t-2 border-red-600 py-6 text-center text-xs text-slate-500 mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Official AD Leiria Logo in Footer */}
              <div className="flex items-center gap-3">
                <AdLeiriaLogo size={40} showText={true} />
              </div>

              {/* Church Ministry Details */}
              <div className="text-center md:text-right space-y-1">
                <p className="font-bold text-slate-700 text-xs">
                  AD Leiria — Igreja Evangélica • Ministério Integrarte
                </p>
                <p className="text-[11px] text-slate-400">
                  Ficha de Registo de Visitantes Ad-Leiria • QR Code & Envio Automático de Mensagens
                </p>
               
              </div>
            </div>
          </footer>
        </>
      )}

      <SystemReportModal
        isOpen={isSystemReportOpen}
        onClose={() => setIsSystemReportOpen(false)}
      />
    </div>
  );
}
