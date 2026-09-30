import React, { useState } from 'react';
import { ShieldAlert, User, KeyRound, Check, AlertCircle, Sparkles } from 'lucide-react';
import { AdLeiriaLogo } from './AdLeiriaLogo';
import { updateCurrentCredentials } from '../utils/authStorage';
import { AppUser } from '../types';

interface ForceChangePasswordModalProps {
  currentUser: AppUser;
  onSuccessUpdated: (updatedUser: AppUser) => void;
}

export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  currentUser,
  onSuccessUpdated,
}) => {
  const [nome, setNome] = useState(currentUser.nome || 'Pastor de Acolhimento');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newUsername.trim()) {
      setError('Por favor defina o seu novo nome de utilizador.');
      return;
    }

    if (newUsername.trim().toLowerCase() === 'admin') {
      setError('Por favor escolha um nome de utilizador diferente de "admin" para sua segurança.');
      return;
    }

    if (newPassword.length < 4) {
      setError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha não coincide com a nova senha.');
      return;
    }

    const result = updateCurrentCredentials(
      currentUser.id,
      newUsername.trim(),
      newPassword,
      nome.trim()
    );

    if (result.success && result.updatedUser) {
      alert('Credenciais registadas com sucesso! Bem-vindo ao Painel Administrativo.');
      onSuccessUpdated(result.updatedUser);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-red-500 animate-in fade-in zoom-in-95 relative overflow-hidden">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-linear-to-r from-red-600 via-rose-500 to-red-600" />

        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center">
            <AdLeiriaLogo size={52} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-xs font-bold mt-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Primeiro Acesso Detectado</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Registo de Novas Credenciais Pastorais
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Por razões de segurança no primeiro acesso, defina as suas credenciais pessoais de acesso pastoral (nome de utilizador e nova senha).
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              O Seu Nome / Função Pastoral
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pr. João Silva / Equipa Acolhimento"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Novo Nome de Utilizador (Username) <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Ex: pastor.joao ou acolhimento"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nova Senha <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirmar Senha <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Novas Credenciais & Entrar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
