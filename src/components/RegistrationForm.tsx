import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Sparkles, 
  Send, 
  RotateCcw, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  QrCode,
  HeartHandshake,
  Users,
  ExternalLink,
  MessageCircle,
  Check,
  AlertTriangle,
  X,
  ArrowRight
} from 'lucide-react';
import { 
  DecisionType, 
  VisitType, 
  AgeRange, 
  HowMetChurch, 
  CelebrationService, 
  RegistrationRecord 
} from '../types';
import { 
  saveStoredRecord, 
  formatGmailComposeUrl, 
  formatOutlookComposeUrl, 
  formatMailtoUrl, 
  formatWhatsAppUrl,
  addSentLog
} from '../utils/storage';
import { AdLeiriaLogo } from './AdLeiriaLogo';

interface RegistrationFormProps {
  onSuccess?: (newRecord: RegistrationRecord) => void;
  onOpenQRModal?: () => void;
  isStandalone?: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onOpenQRModal,
  isStandalone = false,
}) => {
  const todayFormatted = new Date().toISOString().slice(0, 10);

  // Form State
  const [decisionType, setDecisionType] = useState<DecisionType>('VISITANTE');
  const [visitType, setVisitType] = useState<VisitType>('1a_visita');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [email, setEmail] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState<AgeRange>('18 a 35 anos');
  const [comoConheceu, setComoConheceu] = useState<HowMetChurch>('Por intermédio de alguém');
  const [comoConheceuDetalhe, setComoConheceuDetalhe] = useState('');
  const [autorizacaoRgpd, setAutorizacaoRgpd] = useState(true);
  const [dataRegisto, setDataRegisto] = useState(todayFormatted);
  const [celebracaoDomingo, setCelebracaoDomingo] = useState<CelebrationService>('17h');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<RegistrationRecord | null>(null);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [missingFieldsList, setMissingFieldsList] = useState<{ id: string; label: string; detail: string }[]>([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Form validations
  const validate = () => {
    const errs: Record<string, string> = {};
    const missing: { id: string; label: string; detail: string }[] = [];

    if (!nome.trim()) {
      errs.nome = 'O nome próprio é obrigatório';
      missing.push({
        id: 'nome',
        label: 'Nome Próprio',
        detail: 'Preencha o primeiro nome do visitante',
      });
    }

    if (!sobrenome.trim()) {
      errs.sobrenome = 'O apelido/sobrenome é obrigatório';
      missing.push({
        id: 'sobrenome',
        label: 'Apelido / Sobrenome',
        detail: 'Preencha o apelido da família',
      });
    }

    if (!telemovel.trim()) {
      errs.telemovel = 'O telemóvel é obrigatório para contacto e envio de versículos';
      missing.push({
        id: 'telemovel',
        label: 'Telemóvel / WhatsApp',
        detail: 'Necessário para contacto e acompanhamento pastoral',
      });
    } else {
      const cleanDigits = telemovel.replace(/\D/g, '');
      if (cleanDigits.length < 9) {
        errs.telemovel = 'Por favor insira um telemóvel válido (mínimo 9 dígitos)';
        missing.push({
          id: 'telemovel',
          label: 'Telemóvel Inválido',
          detail: 'O número deve ter pelo menos 9 dígitos',
        });
      }
    }

    // E-mail é opcional: valida o formato apenas se for preenchido
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Insira um endereço de e-mail válido';
      missing.push({
        id: 'email',
        label: 'Formato de E-mail',
        detail: 'Corrija o formato do e-mail (ex: exemplo@email.pt)',
      });
    }

    if (comoConheceu === 'Outra (especifique)' && !comoConheceuDetalhe.trim()) {
      errs.comoConheceuDetalhe = 'Por favor especifique como conheceu';
      missing.push({
        id: 'comoConheceuDetalhe',
        label: 'Como Conheceu a Igreja',
        detail: 'Especifique resumidamente como conheceu a AD Leiria',
      });
    }

    if (!autorizacaoRgpd) {
      errs.rgpd = 'É necessário autorizar o tratamento de dados (RGPD) para registo na igreja';
      missing.push({
        id: 'autorizacaoRgpd',
        label: 'Autorização RGPD (Proteção de Dados)',
        detail: 'Marque a caixa confirmando a autorização conforme o RGPD',
      });
    }

    setErrors(errs);
    setMissingFieldsList(missing);
    return { isValid: missing.length === 0, missing, errs };
  };

  const handleFocusField = (fieldId: string) => {
    setShowValidationPopup(false);
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus?.();
        el.classList.add('ring-4', 'ring-amber-400', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-amber-400');
        }, 2000);
      }
    }, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, missing } = validate();
    if (!isValid) {
      setShowValidationPopup(true);
      return;
    }

    setIsSubmitting(true);

    const newRecord: RegistrationRecord = {
      id: 'rec-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      decisionType,
      visitType,
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      telemovel: telemovel.trim(),
      email: email.trim().toLowerCase(),
      faixaEtaria,
      comoConheceu,
      comoConheceuDetalhe: comoConheceuDetalhe.trim() || '',
      autorizacaoRgpd,
      dataRegisto,
      celebracaoDomingo,
      assinatura: '',
      acompanhamento: {
        visita1: false,
        visita2: false,
        visita3: false,
        visita4: false,
        cafeComPastor: false,
        notasPastorais: `Registo efetuado em ${dataRegisto}. ${celebracaoDomingo === '21h' ? 'Culto de Sexta às 21h' : `Culto de Domingo às ${celebracaoDomingo}`}.`,
        responsavel: 'Equipa Ministério Integrarte',
        ultimaInteracao: todayFormatted,
      },
      tags: [decisionType === 'VISITANTE' ? 'Visitante' : decisionType === 'CONVERSAO' ? 'Decisão / Conversão' : 'Reconciliação'],
    };

    setTimeout(() => {
      saveStoredRecord(newRecord);
      setIsSubmitting(false);
      setSubmittedRecord(newRecord);
      setShowSuccessPopup(true);

      // Trigger festive confetti
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.5 },
        colors: ['#dc2626', '#ef4444', '#b91c1c', '#ffffff', '#10b981'],
      });

      if (onSuccess) {
        onSuccess(newRecord);
      }
    }, 450);
  };

  const handleResetForm = () => {
    setNome('');
    setSobrenome('');
    setTelemovel('');
    setEmail('');
    setComoConheceuDetalhe('');
    setErrors({});
    setSubmittedRecord(null);
    setShowSuccessPopup(false);
    setShowValidationPopup(false);
  };

  const renderSuccessPopup = () => {
    if (!showSuccessPopup || !submittedRecord) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
        <div 
          role="dialog"
          aria-modal="true"
          className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-300 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 relative text-center"
        >
          {/* Top Accent Strip */}
          <div className="h-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-red-600" />

          <div className="p-6 sm:p-8">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Fechar aviso"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success Badge */}
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3.5 border-2 border-emerald-200 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight">
              Ficha Enviada com Sucesso!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mb-5 leading-relaxed">
              Seja muito bem-vindo(a) à <span className="font-bold text-red-600">AD Leiria</span>! Os seus dados foram registados no Ministério Integrarte.
            </p>

            {/* Details card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-5 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Nome:</span>
                <span className="font-bold text-slate-900">{submittedRecord.nome} {submittedRecord.sobrenome}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Tipo:</span>
                <span className="font-bold text-red-700 uppercase text-[11px] px-2.5 py-0.5 bg-red-100 rounded-full">
                  {submittedRecord.decisionType}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Telemóvel:</span>
                <span className="font-semibold text-slate-800">{submittedRecord.telemovel || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Celebração:</span>
                <span className="font-bold text-slate-900">
                  {submittedRecord.celebracaoDomingo === '21h'
                    ? 'Sexta-feira às 21h'
                    : `Domingo às ${submittedRecord.celebracaoDomingo}`}
                </span>
              </div>
            </div>

            {/* Quick Actions (WhatsApp & Email) */}
            {(submittedRecord.telemovel || submittedRecord.email) && (
              <div className="mb-5 p-3.5 bg-red-50/60 border border-red-100 rounded-2xl text-left space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Ações Rápidas de Acolhimento:
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  {submittedRecord.telemovel && (
                    <a
                      href={formatWhatsAppUrl(
                        submittedRecord.telemovel,
                        `A Paz do Senhor, ${submittedRecord.nome}! ✨ Seja muito bem-vindo(a) à AD Leiria - Ministério Integrarte. Foi um grande privilégio ter-te connosco!`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        addSentLog({
                          id: 'log-' + Math.random().toString(36).substr(2, 9),
                          tipo: 'whatsapp',
                          versiculoRef: 'Boas-Vindas',
                          conteudo: `Boas-vindas via WhatsApp enviadas para ${submittedRecord.telemovel}`,
                          dataEnvio: new Date().toISOString(),
                          status: 'enviado',
                          destinatarioNome: `${submittedRecord.nome} ${submittedRecord.sobrenome}`.trim(),
                          destinatarioContacto: submittedRecord.telemovel,
                        });
                      }}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Abrir WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {submittedRecord.email && (
                    <a
                      href={formatGmailComposeUrl(
                        submittedRecord.email,
                        'Bem-vindo(a) à AD Leiria • Ministério Integrarte',
                        `Olá ${submittedRecord.nome},\n\nÉ com imensa alegria que te damos as boas-vindas à AD Leiria - Ministério Integrarte! Que a bênção e a presença de Deus estejam abundantemente sobre a tua vida.\n\n"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti." — Números 6:24-25\n\nCom carinho pastoral,\nEquipa Integrarte • AD Leiria`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        addSentLog({
                          id: 'log-' + Math.random().toString(36).substr(2, 9),
                          tipo: 'email',
                          versiculoRef: 'Números 6:24-25',
                          conteudo: `Boas-vindas enviadas para ${submittedRecord.email}`,
                          dataEnvio: new Date().toISOString(),
                          status: 'enviado',
                          destinatarioNome: `${submittedRecord.nome} ${submittedRecord.sobrenome}`.trim(),
                          destinatarioContacto: submittedRecord.email,
                        });
                      }}
                      className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Enviar E-mail</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-3 px-5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Preencher Novo Registo</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessPopup(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderValidationPopup = () => {
    if (!showValidationPopup || missingFieldsList.length === 0) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
        <div 
          role="dialog"
          aria-modal="true"
          className="bg-white rounded-3xl shadow-2xl border-2 border-amber-300 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Top Accent Strip */}
          <div className="h-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          <div className="p-6 sm:p-7">
            {/* Icon & Close */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <button
                type="button"
                onClick={() => setShowValidationPopup(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Fechar aviso"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Description */}
            <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">
              Atenção: Campos em Falta!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              Para podermos registar a ficha no Ministério Integrarte, por favor preencha os seguintes campos obrigatórios:
            </p>

            {/* List of Missing Fields */}
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
              {missingFieldsList.map((item, idx) => (
                <button
                  key={item.id + idx}
                  type="button"
                  onClick={() => handleFocusField(item.id)}
                  className="w-full p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/90 border border-amber-200 text-left transition-all flex items-center justify-between group cursor-pointer"
                  title={`Preencher campo ${item.label}`}
                >
                  <div className="flex items-center gap-2.5 pr-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 group-hover:scale-125 transition-transform" />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.detail}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-600 shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => handleFocusField(missingFieldsList[0]?.id || 'nome')}
              className="w-full py-3.5 px-5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Compreendi, Vou Preencher</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (submittedRecord) {
    return (
      <div className="relative">
        {renderSuccessPopup()}
        <div className="max-w-2xl mx-auto bg-white border-2 border-red-200 shadow-2xl rounded-3xl p-6 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-red-600" />

        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">
          Registo Concluído com Sucesso!
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-6">
          Seja muito bem-vindo(a) à <span className="font-bold text-red-600">AD Leiria</span>! Os seus dados foram registados no Ministério Integrarte.
        </p>

        <div className="bg-red-50/60 border border-red-100 rounded-2xl p-5 text-left mb-6 max-w-md mx-auto space-y-2.5 text-sm">
          <div className="flex justify-between py-1 border-b border-red-100">
            <span className="text-slate-500 font-medium">Nome:</span>
            <span className="font-bold text-slate-900">{submittedRecord.nome} {submittedRecord.sobrenome}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-red-100">
            <span className="text-slate-500 font-medium">Tipo:</span>
            <span className="font-bold text-red-700 uppercase text-xs px-2.5 py-0.5 bg-red-100 rounded-full">
              {submittedRecord.decisionType}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-red-100">
            <span className="text-slate-500 font-medium">Telemóvel:</span>
            <span className="font-semibold text-slate-800">{submittedRecord.telemovel || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-red-100">
            <span className="text-slate-500 font-medium">E-mail:</span>
            <span className="font-semibold text-slate-800">{submittedRecord.email || '—'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 font-medium">Celebração:</span>
            <span className="font-bold text-slate-900">
              {submittedRecord.celebracaoDomingo === '21h'
                ? 'Sexta-feira às 21h'
                : `Domingo às ${submittedRecord.celebracaoDomingo}`}
            </span>
          </div>
        </div>

        {/* Quick Pastoral Follow-up Actions for Registered Person */}
        <div className="max-w-md mx-auto mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Ações Rápidas de Acolhimento:
          </span>

          <div className="flex flex-col gap-2">
            {submittedRecord.email && (
              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{submittedRecord.email}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={formatGmailComposeUrl(
                      submittedRecord.email,
                      'Bem-vindo(a) à AD Leiria • Ministério Integrarte',
                      `Olá ${submittedRecord.nome},\n\nÉ com imensa alegria que te damos as boas-vindas à AD Leiria - Ministério Integrarte! Que a bênção e a presença de Deus estejam abundantemente sobre a tua vida.\n\n"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti." — Números 6:24-25\n\nCom carinho pastoral,\nEquipa Integrarte • AD Leiria`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      addSentLog({
                        id: 'log-' + Math.random().toString(36).substr(2, 9),
                        tipo: 'email',
                        versiculoRef: 'Números 6:24-25',
                        conteudo: `Boas-vindas enviadas para ${submittedRecord.email}`,
                        dataEnvio: new Date().toISOString(),
                        status: 'enviado',
                        destinatarioNome: `${submittedRecord.nome} ${submittedRecord.sobrenome}`.trim(),
                        destinatarioContacto: submittedRecord.email,
                      });
                    }}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-1 transition-colors"
                    title="Enviar e-mail de acolhimento via Gmail"
                  >
                    <span>Gmail</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={formatMailtoUrl(
                      submittedRecord.email,
                      'Bem-vindo(a) à AD Leiria • Ministério Integrarte',
                      `Olá ${submittedRecord.nome},\n\nÉ com imensa alegria que te damos as boas-vindas à AD Leiria - Ministério Integrarte! Que a bênção e a presença de Deus estejam abundantemente sobre a tua vida.\n\n"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti." — Números 6:24-25\n\nCom carinho pastoral,\nEquipa Integrarte • AD Leiria`
                    )}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center gap-1 transition-colors"
                    title="Abrir no cliente de e-mail padrão"
                  >
                    <span>App E-mail</span>
                  </a>
                </div>
              </div>
            )}

            {submittedRecord.telemovel && (
              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{submittedRecord.telemovel}</span>
                </div>
                <a
                  href={formatWhatsAppUrl(
                    submittedRecord.telemovel,
                    `A Paz do Senhor, ${submittedRecord.nome}! ✨ Seja muito bem-vindo(a) à AD Leiria - Ministério Integrarte. Foi um privilégio ter-te connosco! Que Deus te abençoe grandemente.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    addSentLog({
                      id: 'log-' + Math.random().toString(36).substr(2, 9),
                      tipo: 'whatsapp',
                      versiculoRef: 'Boas-Vindas',
                      conteudo: `Boas-vindas via WhatsApp enviadas para ${submittedRecord.telemovel}`,
                      dataEnvio: new Date().toISOString(),
                      status: 'enviado',
                      destinatarioNome: `${submittedRecord.nome} ${submittedRecord.sobrenome}`.trim(),
                      destinatarioContacto: submittedRecord.telemovel,
                    });
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 transition-colors shrink-0"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Preencher Novo Registo
          </button>
          {onOpenQRModal && (
            <button
              type="button"
              onClick={onOpenQRModal}
              className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-red-600" />
              Ver QR Code / Link
            </button>
          )}
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto relative">
      {renderValidationPopup()}
      {renderSuccessPopup()}

      {/* Visual Paper Form Container in Red & White Palette */}
      <div className="bg-white border-2 border-slate-300 shadow-2xl rounded-3xl overflow-hidden">
        {/* Official Header in Red & White Theme */}
        <div className="bg-white text-slate-900 p-6 sm:p-8 border-b-2 border-red-600 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <AdLeiriaLogo size={52} showText={true} />
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3.5 py-1 bg-red-600 text-white rounded-full text-xs font-bold uppercase tracking-wider mb-1 shadow-2xs">
                Integrarte
              </span>
              <p className="text-xs text-slate-500 font-semibold">Ministério de Integração</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-red-600 leading-none">
                Ficha de Registo de Visitantes
              </h2>
              <span className="text-xs text-slate-500 font-bold">Ad-Leiria</span>
            </div>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Conforme RGPD UE
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* SECTION 1: DECISION TYPE (VISITANTE / CONVERSAO / RECONCILIACAO) */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Tipo de Decisão / Presença <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { type: 'VISITANTE', label: 'Visitante', icon: Users, desc: 'Pela primeira vez ou visita' },
                  { type: 'CONVERSAO', label: 'Conversão', icon: Sparkles, desc: 'Aceitou Jesus como Salvador' },
                  { type: 'RECONCILIACAO', label: 'Reconciliação', icon: HeartHandshake, desc: 'Retorno aos caminhos de Deus' },
                ] as const
              ).map((item) => {
                const isSelected = decisionType === item.type;
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setDecisionType(item.type)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50/80 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600' : 'text-slate-500'}`} />
                        <span className={`font-bold text-sm ${isSelected ? 'text-red-700' : 'text-slate-800'}`}>
                          {item.label}
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-red-600 bg-red-600' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: PERSONAL INFORMATION */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NOME */}
              <div>
                <label htmlFor="nome" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nome <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      if (errors.nome) setErrors((prev) => ({ ...prev, nome: '' }));
                    }}
                    placeholder="Ex: Roseane"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                      errors.nome
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-300 focus:ring-red-600 focus:border-red-600'
                    }`}
                  />
                </div>
                {errors.nome && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.nome}</p>}
              </div>

              {/* APELIDO / SOBRENOME */}
              <div>
                <label htmlFor="sobrenome" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Apelido / Sobrenome <span className="text-red-600">*</span>
                </label>
                <input
                  id="sobrenome"
                  type="text"
                  value={sobrenome}
                  onChange={(e) => {
                    setSobrenome(e.target.value);
                    if (errors.sobrenome) setErrors((prev) => ({ ...prev, sobrenome: '' }));
                  }}
                  placeholder="Ex: Gomes"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                    errors.sobrenome
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:ring-red-600 focus:border-red-600'
                  }`}
                />
                {errors.sobrenome && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.sobrenome}</p>}
              </div>
            </div>

            {/* TELEMOVEL & EMAIL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TELEMÓVEL */}
              <div>
                <label htmlFor="telemovel" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Telemóvel / WhatsApp <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="telemovel"
                    type="tel"
                    value={telemovel}
                    onChange={(e) => {
                      setTelemovel(e.target.value);
                      if (errors.telemovel) setErrors((prev) => ({ ...prev, telemovel: '' }));
                    }}
                    placeholder="Ex: +351 963 054 307 ou 963054307"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                      errors.telemovel
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-300 focus:ring-red-600 focus:border-red-600'
                    }`}
                  />
                </div>
                {errors.telemovel && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.telemovel}</p>}
                <p className="text-[11px] text-slate-500 mt-1">
                  Usado para o envio programado de versículos e mensagens da igreja.
                </p>
              </div>

              {/* EMAIL */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  E-mail <span className="text-slate-400 font-normal normal-case text-[11px]">(Opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="Ex: exemplo@email.pt (opcional)"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-300 focus:ring-red-600 focus:border-red-600'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.email}</p>}
                <p className="text-[11px] text-slate-500 mt-1">
                  Opcional — para receber mensagens e devocionais por e-mail.
                </p>
              </div>
            </div>

            {/* FAIXA ETÁRIA */}
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Faixa Etária
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(['12 a 17 anos', '18 a 35 anos', '35 anos acima'] as AgeRange[]).map((range) => {
                  const isSelected = faixaEtaria === range;
                  return (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setFaixaEtaria(range)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'border-red-600 bg-red-600 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {range}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COMO CONHECEU A AD LEIRIA? */}
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Como Conheceu a AD Leiria?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    'Instagram',
                    'Facebook',
                    'Website',
                    'Google',
                    'Evangelismo de rua',
                    'Por intermédio de alguém',
                    'Outra (especifique)',
                  ] as HowMetChurch[]
                ).map((opt) => {
                  const isSelected = comoConheceu === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setComoConheceu(opt)}
                      className={`px-3.5 py-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt}</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-red-600 bg-red-600' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {(comoConheceu === 'Por intermédio de alguém' || comoConheceu === 'Outra (especifique)') && (
                <div className="mt-2.5">
                  <input
                    id="comoConheceuDetalhe"
                    type="text"
                    value={comoConheceuDetalhe}
                    onChange={(e) => {
                      setComoConheceuDetalhe(e.target.value);
                      if (errors.comoConheceuDetalhe) setErrors((prev) => ({ ...prev, comoConheceuDetalhe: '' }));
                    }}
                    placeholder={
                      comoConheceu === 'Por intermédio de alguém'
                        ? 'Ex: Gabriela (quem o(a) convidou? - opcional)'
                        : 'Especifique como conheceu a igreja...'
                    }
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                      errors.comoConheceuDetalhe
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-slate-300 focus:ring-red-600 focus:border-red-600'
                    }`}
                  />
                  {errors.comoConheceuDetalhe && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">{errors.comoConheceuDetalhe}</p>
                  )}
                </div>
              )}
            </div>

            {/* DATE & SUNDAY SERVICE TIME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Data do Registo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={dataRegisto}
                    onChange={(e) => setDataRegisto(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Celebração Domingo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['10h', '17h'] as CelebrationService[]).map((time) => {
                      const isSelected = celebracaoDomingo === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setCelebracaoDomingo(time)}
                          className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-red-600 bg-red-600 text-white shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Celebração de Sexta
                  </label>
                  <button
                    type="button"
                    onClick={() => setCelebracaoDomingo('21h')}
                    className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      celebracaoDomingo === '21h'
                        ? 'border-red-600 bg-red-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>21h</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RGPD CONSENT BOX */}
            <div className="pt-3">
              <label
                id="rgpd"
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${
                  errors.rgpd
                    ? 'border-red-400 bg-red-50/60'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <input
                  id="autorizacaoRgpd"
                  type="checkbox"
                  checked={autorizacaoRgpd}
                  onChange={(e) => {
                    setAutorizacaoRgpd(e.target.checked);
                    if (errors.rgpd) setErrors((prev) => ({ ...prev, rgpd: '' }));
                  }}
                  className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-600 border-slate-300"
                />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-900">
                    Autorizo o tratamento dos meus dados pessoais
                  </span>{' '}
                  para efeitos de registo, integração e comunicação da igreja, nos termos do Regulamento Geral de Proteção de Dados (RGPD – Regulamento (UE) 2016/679).
                </div>
              </label>
              {errors.rgpd && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.rgpd}</p>}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 px-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <span>A guardar registo...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submeter Ficha de Registo</span>
                </>
              )}
            </button>

            {onOpenQRModal && !isStandalone && (
              <button
                type="button"
                onClick={onOpenQRModal}
                className="py-4 px-5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                title="Partilhar QR Code ou Link do Formulário"
              >
                <QrCode className="w-4 h-4 text-red-600" />
                <span className="hidden sm:inline">QR Code / Link</span>
              </button>
            )}
          </div>
        </form>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 text-center text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2">
          <span className="font-semibold text-slate-700">AD Leiria — Ministério Integrarte</span>
          <span>Registo Confidencial & Acompanhamento Pastoral</span>
        </div>
      </div>
    </div>
  );
};
