import React, { useState, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Check, 
  X, 
  HelpCircle, 
  ExternalLink, 
  Key, 
  Globe, 
  Zap, 
  Sparkles,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Info,
  Cloud,
  CloudCheck
} from 'lucide-react';
import { 
  getDirectGatewayConfig, 
  saveDirectGatewayConfig, 
  applyCloudGatewayConfig,
  DirectGatewayConfig,
  WhatsAppProviderPreset,
  testWhatsAppGatewayConnection,
  testEmailConnection,
  normalizeWhatsAppGatewayUrl,
  formatWhatsAppRecipientPhone
} from '../utils/directSender';
import { subscribeToGatewayConfig } from '../utils/cloudSync';

interface DirectGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
  onSwitchToAssistedMode?: () => void;
}

export const DirectGatewayModal: React.FC<DirectGatewayModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  onSwitchToAssistedMode,
}) => {
  const [config, setConfig] = useState<DirectGatewayConfig>(getDirectGatewayConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Test state
  const [testPhone, setTestPhone] = useState('');
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [whatsAppTestResult, setWhatsAppTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testEmail, setTestEmail] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getDirectGatewayConfig());
      setSavedSuccess(false);
      setWhatsAppTestResult(null);
      setEmailTestResult(null);

      const unsub = subscribeToGatewayConfig((cloudConfig) => {
        if (cloudConfig && typeof cloudConfig === 'object') {
          const merged = applyCloudGatewayConfig(cloudConfig);
          setConfig(merged);
        }
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderPresetChange = (preset: WhatsAppProviderPreset) => {
    let url = config.whatsappGatewayUrl;
    if (preset === 'ultramsg' && (!url || url.includes('sua-api') || url.includes('z-api') || url.includes('make.com'))) {
      url = 'https://api.ultramsg.com/instanceXXXXX/messages/chat';
    } else if (preset === 'make' && (!url || url.includes('ultramsg') || url.includes('sua-evolution') || url.includes('z-api'))) {
      url = 'https://hook.eu2.make.com/sua-chave-webhook';
    } else if (preset === 'evolution' && (!url || url.includes('ultramsg') || url.includes('z-api') || url.includes('make.com'))) {
      url = 'https://sua-evolution-api.com/message/sendText/nome-instancia';
    } else if (preset === 'zapi' && (!url || url.includes('ultramsg') || url.includes('evolution') || url.includes('make.com'))) {
      url = 'https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-text';
    } else if (preset === 'custom_webhook' && (!url || url.includes('ultramsg') || url.includes('make.com'))) {
      url = 'https://seu-webhook.com/whatsapp-send';
    }

    setConfig((prev) => ({
      ...prev,
      whatsappProvider: preset,
      whatsappGatewayUrl: url,
    }));
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone) {
      setWhatsAppTestResult({
        success: false,
        message: 'Por favor, digite um número de telemóvel para receber a mensagem de teste.',
      });
      return;
    }

    setIsTestingWhatsApp(true);
    setWhatsAppTestResult(null);

    const formattedTestPhone = formatWhatsAppRecipientPhone(testPhone);
    const normalizedConfig: DirectGatewayConfig = {
      ...config,
      whatsappGatewayUrl: normalizeWhatsAppGatewayUrl(config.whatsappGatewayUrl, config.whatsappApiToken),
    };

    const res = await testWhatsAppGatewayConnection(formattedTestPhone, normalizedConfig);
    setWhatsAppTestResult(res);
    setIsTestingWhatsApp(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setEmailTestResult({
        success: false,
        message: 'Por favor, digite um endereço de e-mail para receber a mensagem de teste.',
      });
      return;
    }

    setIsTestingEmail(true);
    setEmailTestResult(null);

    const res = await testEmailConnection(testEmail, config);
    setEmailTestResult(res);
    setIsTestingEmail(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const hasWhatsApp = Boolean(config.whatsappGatewayUrl && config.whatsappGatewayUrl.trim().length > 5);
    const normalizedConfig: DirectGatewayConfig = {
      ...config,
      enabled: hasWhatsApp || config.enabled,
      whatsappEnabled: hasWhatsApp ? true : config.whatsappEnabled,
      whatsappGatewayUrl: normalizeWhatsAppGatewayUrl(config.whatsappGatewayUrl, config.whatsappApiToken),
    };
    saveDirectGatewayConfig(normalizedConfig);
    setConfig(normalizedConfig);
    setSavedSuccess(true);
    if (onConfigSaved) onConfigSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleUseFreeWhatsAppWeb = () => {
    // Disable direct sending so user can send easily via WhatsApp Web without API
    const updated = { ...config, enabled: false, whatsappEnabled: false };
    setConfig(updated);
    saveDirectGatewayConfig(updated);
    if (onSwitchToAssistedMode) onSwitchToAssistedMode();
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-6 border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Configuração de Disparo (WhatsApp & E-mail)
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                Entenda como funciona o envio direto ou utilize o modo gratuito via WhatsApp Web
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          {/* Visual Explainer Box: 2 Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1.5 text-emerald-900 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>OPÇÃO 1: WhatsApp Web (Sem API)</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed mb-2.5">
                <strong>100% Grátis e pronto a usar.</strong> Não necessita de servidores, códigos nem de pagar serviços externos. Abre a conversa oficial com o texto pronto e carrega em Enviar.
              </p>
              <button
                type="button"
                onClick={handleUseFreeWhatsAppWeb}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Usar WhatsApp Web Gratuito
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-center gap-2 mb-1.5 text-amber-950 font-extrabold text-xs">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>OPÇÃO 2: Envio Direto em 2º Plano</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                O WhatsApp <strong>não permite</strong> envio silencioso sem uma API conectada ao número da igreja (ex: <strong>UltraMsg</strong> ou <strong>Evolution API</strong>). Se tiver uma API, preencha os campos abaixo!
              </p>
            </div>
          </div>

          {/* Master Enable Toggle */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-600" />
                Ativar Disparo Direto em Segundo Plano
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Se ativado com a API configurada, o sistema envia para os destinatários sem abrir o WhatsApp Web.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className="cursor-pointer text-red-600 focus:outline-none shrink-0"
            >
              {config.enabled ? (
                <ToggleRight className="w-9 h-9 text-red-600" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-slate-400" />
              )}
            </button>
          </div>

          {/* Cloud Persistence Notice */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-300/60 flex items-center justify-center shrink-0 mt-0.5">
              <Cloud className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <span>Guardado Permanente na Nuvem (Firestore)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-200/80 text-blue-800">
                  <CloudCheck className="w-3 h-3 text-blue-700" /> Ativo
                </span>
              </div>
              <p className="text-blue-900 leading-relaxed">
                A sua API de WhatsApp é sincronizada instantaneamente com a base de dados na nuvem da AD Leiria. <strong>Nunca se perde</strong>, mesmo ao fechar o navegador, limpar o histórico, trocar de computador ou aceder pelo telemóvel!
              </p>
            </div>
          </div>

          {/* Section: WhatsApp Gateway */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Gateway de WhatsApp para Envio Direto
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, whatsappEnabled: !prev.whatsappEnabled }))}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                {config.whatsappEnabled ? '✓ Ativado' : 'Desativado'}
              </button>
            </div>

            {/* Provider presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Selecione o seu Provedor de API WhatsApp:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { id: 'ultramsg', label: 'UltraMsg', note: 'Recomendado' },
                  { id: 'make', label: 'Make.com', note: 'Webhook / Meta' },
                  { id: 'evolution', label: 'Evolution', note: 'Open-Source' },
                  { id: 'zapi', label: 'Z-API', note: 'Comercial' },
                  { id: 'custom_webhook', label: 'Outro Webhook', note: 'n8n / Custom' },
                ].map((item) => {
                  const isSel = (config.whatsappProvider || 'ultramsg') === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleProviderPresetChange(item.id as WhatsAppProviderPreset)}
                      className={`p-2 rounded-xl text-xs text-left border transition-all cursor-pointer ${
                        isSel
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-extrabold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div>{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.note}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explainer for selected provider */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
              {config.whatsappProvider === 'ultramsg' && (
                <div>
                  <strong>Como usar UltraMsg:</strong> Crie uma conta em{' '}
                  <a href="https://ultramsg.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline">
                    ultramsg.com
                  </a>{' '}
                  (teste grátis disponível), escaneie o QR Code com o WhatsApp da igreja, e copie a <strong>URL da Instância</strong> e o <strong>Token</strong>.
                </div>
              )}
              {config.whatsappProvider === 'make' && (
                <div>
                  <strong>Como usar com o Make.com (Integromat):</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-700">
                    <li>No <a href="https://make.com" target="_blank" rel="noopener noreferrer" className="text-purple-700 font-bold underline">make.com</a> crie um novo cenário e adicione o módulo <strong>Webhooks &gt; Custom webhook</strong>.</li>
                    <li>Copie o URL gerado (ex: <code>https://hook.eu2.make.com/...</code>) e cole no campo <strong>URL da API / Endpoint</strong> abaixo. O campo Token pode ficar em branco.</li>
                    <li>No Make, adicione a seguir o módulo de envio: <strong>WhatsApp Business Cloud API</strong> (oficial da Meta), <strong>Z-API</strong> ou outro gateway.</li>
                    <li>O Make recebe os campos: <code>to</code> (número com +351), <code>phone</code>, <code>message</code> e <code>name</code> (nome do contacto).</li>
                  </ul>
                </div>
              )}
              {config.whatsappProvider === 'evolution' && (
                <div>
                  <strong>Como usar Evolution API:</strong> Se a igreja tiver uma VPS própria (ex: Railway, Docker), utilize a URL da sua rota de envio de texto e a sua <code>apikey</code>.
                </div>
              )}
              {config.whatsappProvider === 'zapi' && (
                <div>
                  <strong>Como usar Z-API:</strong> Utilize o endpoint de envio de texto fornecido no painel da sua instância Z-API.
                </div>
              )}
              {config.whatsappProvider === 'custom_webhook' && (
                <div>
                  <strong>Webhook Personalizado:</strong> O sistema envia um <code>POST JSON</code> contendo <code>{`{ to, phone, message, text, name }`}</code> para a URL especificada.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> URL da API / Endpoint:
                  </span>
                  {config.whatsappGatewayUrl?.includes('ultramsg') && (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> UltraMsg detectada
                    </span>
                  )}
                </label>
                <input
                  type="url"
                  placeholder="https://api.ultramsg.com/instanceXXXXX/messages/chat"
                  value={config.whatsappGatewayUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfig({ ...config, whatsappGatewayUrl: val });
                  }}
                  onBlur={() => {
                    if (config.whatsappGatewayUrl) {
                      const normalized = normalizeWhatsAppGatewayUrl(config.whatsappGatewayUrl, config.whatsappApiToken);
                      if (normalized !== config.whatsappGatewayUrl) {
                        setConfig({ ...config, whatsappGatewayUrl: normalized });
                      }
                    }
                  }}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none font-mono"
                />

                {config.whatsappGatewayUrl && config.whatsappGatewayUrl.includes('ultramsg') && (
                  <div className="mt-1.5 p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Endpoint formatado automaticamente:</span>{' '}
                      <code className="text-[10px] font-mono bg-emerald-100/60 px-1 py-0.5 rounded">
                        {normalizeWhatsAppGatewayUrl(config.whatsappGatewayUrl, config.whatsappApiToken)}
                      </code>
                      <p className="text-[10px] text-emerald-700 mt-0.5">
                        A rota <code>/messages/chat</code> é aplicada para que as mensagens cheguem diretamente ao telemóvel de destino.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-400" /> Token de Autenticação / API Key (se aplicável):
                </label>
                <input
                  type="password"
                  placeholder="Ex: seu token ou chave secreta..."
                  value={config.whatsappApiToken}
                  onChange={(e) => setConfig({ ...config, whatsappApiToken: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none font-mono"
                />
              </div>

              {/* Live Test WhatsApp */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                    Testar Conexão do WhatsApp agora:
                  </span>
                  <span className="text-[10px] text-emerald-700">Portugal: +351</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Digite seu telemóvel (ex: +351 912345678 ou 912345678)"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1 p-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isTestingWhatsApp}
                    onClick={handleTestWhatsApp}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {isTestingWhatsApp ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>A testar...</span>
                      </>
                    ) : (
                      <span>Enviar Teste</span>
                    )}
                  </button>
                </div>

                {whatsAppTestResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium flex items-start gap-1.5 ${
                      whatsAppTestResult.success
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {whatsAppTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    )}
                    <span>{whatsAppTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Email API */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  E-mail Direto em 2º Plano (Resend API)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, emailEnabled: !prev.emailEnabled }))}
                className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                {config.emailEnabled ? '✓ Ativado' : 'Desativado'}
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Dispara e-mails diretamente com formatação profissional via <strong>Resend</strong> (gratuito até 3.000 e-mails/mês). Obtenha a chave grátis em{' '}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-red-600 underline font-semibold">
                resend.com
              </a>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-400" /> Chave de API Resend (começa por re_...):
                </label>
                <input
                  type="password"
                  placeholder="re_123456789..."
                  value={config.emailApiKey}
                  onChange={(e) => setConfig({ ...config, emailApiKey: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome & E-mail Remetente:
                </label>
                <input
                  type="text"
                  placeholder="AD Leiria Integrarte <onboarding@resend.dev>"
                  value={config.emailSender}
                  onChange={(e) => setConfig({ ...config, emailSender: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {/* Live Test Email */}
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-blue-600" />
                  Testar Envio de E-mail agora:
                </span>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Digite seu e-mail de teste"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 p-2 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isTestingEmail}
                    onClick={handleTestEmail}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {isTestingEmail ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>A testar...</span>
                      </>
                    ) : (
                      <span>Enviar Teste</span>
                    )}
                  </button>
                </div>

                {emailTestResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium flex items-start gap-1.5 ${
                      emailTestResult.success
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {emailTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    )}
                    <span>{emailTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={handleUseFreeWhatsAppWeb}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
            >
              Usar WhatsApp Web Gratuito
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" /> Guardado com Sucesso!
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Guardar Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
