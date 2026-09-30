import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Key, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  Lock, 
  UserCheck, 
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';
import { AppUser } from '../types';
import { getStoredUsers, createOrUpdateUser, deleteUser } from '../utils/authStorage';

interface UserManagementProps {
  currentUser: AppUser;
  onUsersUpdated?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  onUsersUpdated,
}) => {
  const [users, setUsers] = useState<AppUser[]>(getStoredUsers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cargo, setCargo] = useState('Pastor / Equipa de Acolhimento');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState<'PASTOR' | 'ADMINISTRADOR'>('PASTOR');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<{ id: string; name: string } | null>(null);

  const reloadUsers = () => {
    const updated = getStoredUsers();
    setUsers(updated);
    if (onUsersUpdated) onUsersUpdated();
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setNome('');
    setUsername('');
    setPassword('');
    setCargo('Pastor / Acolhimento');
    setEmail('');
    setTelefone('');
    setRole('PASTOR');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    setNome(user.nome);
    setUsername(user.username);
    setPassword(user.password);
    setCargo(user.cargo || 'Pastor');
    setEmail(user.email || '');
    setTelefone(user.telefone || '');
    setRole(user.role);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nome.trim() || !username.trim() || !password.trim()) {
      setFormError('Por favor preencha o Nome, Nome de Utilizador e Senha.');
      return;
    }

    if (password.length < 4) {
      setFormError('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    const userPayload: AppUser = {
      id: editingUser ? editingUser.id : 'user-' + Math.random().toString(36).substr(2, 9),
      nome: nome.trim(),
      username: username.trim(),
      password: password,
      cargo: cargo.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      role: role,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      requiresPasswordChange: false,
    };

    const result = createOrUpdateUser(userPayload);

    if (result.success) {
      setUsers(result.users);
      setShowAddModal(false);
      setSuccessMessage(
        editingUser
          ? `Conta de "${userPayload.nome}" atualizada com sucesso!`
          : `Novo pastor/utilizador "${userPayload.nome}" criado com sucesso!`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      reloadUsers();
    } else {
      setFormError(result.message);
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    setDeleteUserTarget({ id, name });
  };

  const confirmDeleteUser = () => {
    if (!deleteUserTarget) return;
    const result = deleteUser(deleteUserTarget.id);
    if (result.success) {
      setUsers(result.users);
      setSuccessMessage(`Utilizador "${deleteUserTarget.name}" removido com sucesso.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      reloadUsers();
    } else {
      setFormError(result.message);
    }
    setDeleteUserTarget(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-[11px] font-black rounded-full uppercase tracking-wider">
              Painel de Administração
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-600">
              Sessão: <b className="text-red-700 font-mono">{currentUser.username}</b>
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-red-600" />
            Gerenciamento de Utilizadores & Acessos
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Crie, edite e configure utilizadores e senhas para os membros da equipa ministerial terem acesso ao Painel Administrativo.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registar Novo Utilizador</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Users List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isSuperAdmin = u.username.toLowerCase() === 'administrador';
          const isCurrentUser = u.id === currentUser.id;

          return (
            <div
              key={u.id}
              className={`bg-white border rounded-3xl p-5 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                isSuperAdmin
                  ? 'border-red-300 ring-2 ring-red-100'
                  : 'border-slate-200 hover:border-red-200'
              }`}
            >
              {/* Top Accent line */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isSuperAdmin ? 'bg-red-600' : 'bg-slate-300'
                }`}
              />

              <div className="space-y-3 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        isSuperAdmin
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}
                    >
                      {u.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                        {u.nome}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {u.cargo || 'Membro da Equipa Pastoral'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      u.role === 'ADMINISTRADOR'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role === 'ADMINISTRADOR' ? 'Admin' : 'Pastor'}
                  </span>
                </div>

                {/* User Details */}
                <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-400">Utilizador:</span>
                    <span className="font-mono font-bold text-red-700">{u.username}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-400">Senha:</span>
                    <span className="font-mono text-slate-500 text-[12px] tracking-widest">
                      ••••••••
                    </span>
                  </div>

                  {u.email && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-400">E-mail:</span>
                      <span className="truncate max-w-[150px] font-medium text-slate-700">
                        {u.email}
                      </span>
                    </div>
                  )}

                  {u.telefone && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-400">Telemóvel:</span>
                      <span className="font-medium text-slate-700">{u.telefone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {isCurrentUser ? '(Você está aqui)' : `Criado a ${new Date(u.createdAt).toLocaleDateString()}`}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(u)}
                    className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar Utilizador & Senha"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {!isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.nome)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar Acesso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingUser ? 'Editar Credenciais do Utilizador' : 'Registar Novo Utilizador'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina o utilizador e a senha de acesso ao Painel Administrativo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome Completo <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Pr. André Oliveira"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cargo / Função Ministerial
                  </label>
                  <input
                    type="text"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Pastor Titular, Acolhimento"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome de Utilizador (Login) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: pastor.andre"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-red-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Senha de Acesso <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha de acesso"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pastor@adleiria.pt"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telemóvel (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+351 9..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nível de Permissão
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('PASTOR')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      role === 'PASTOR'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Pastor / Acolhimento
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMINISTRADOR')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      role === 'ADMINISTRADOR'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Administrador Geral
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs"
                >
                  {editingUser ? 'Salvar Alterações' : 'Criar Utilizador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Eliminação de Utilizador */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">
              Remover Utilizador
            </h3>
            <p className="text-sm text-slate-600 text-center mt-2 leading-relaxed">
              Tem a certeza que deseja eliminar o acesso de <strong className="text-slate-900">"{deleteUserTarget.name}"</strong>?
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteUserTarget(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
