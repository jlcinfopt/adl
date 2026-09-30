import { AppUser, AuthSession } from '../types';
import { syncUserToCloud, deleteUserFromCloud } from './cloudSync';

const USERS_STORAGE_KEY = 'adleiria_auth_users_v2';
const SESSION_STORAGE_KEY = 'adleiria_current_session_v2';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'user-admin-default',
    username: 'admin',
    password: 'admin',
    nome: 'Pastor de Acolhimento (Conta Inicial)',
    role: 'PASTOR',
    cargo: 'Equipa de Acolhimento / Pastoral',
    email: 'pastoral@adleiria.pt',
    createdAt: new Date().toISOString(),
    requiresPasswordChange: true, // Prompts to change credentials upon first login
  },
  {
    id: 'user-master-admin',
    username: 'administrador',
    password: 'admin12345',
    nome: 'Administrador Geral do Sistema',
    role: 'ADMINISTRADOR',
    cargo: 'Administração & Gestão Pastoral',
    email: 'administrador@adleiria.pt',
    createdAt: new Date().toISOString(),
    requiresPasswordChange: false,
  },
];

export function getStoredUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed: AppUser[] = JSON.parse(raw);
    
    // Ensure master administrator exists if corrupted
    const hasAdmin = parsed.some((u) => u.username.toLowerCase() === 'administrador');
    if (!hasAdmin) {
      const updated = [...parsed, INITIAL_USERS[1]];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading users', e);
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: AppUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function createOrUpdateUser(user: AppUser): { success: boolean; message: string; users: AppUser[] } {
  const users = getStoredUsers();
  const existingByUsername = users.find(
    (u) => u.username.toLowerCase() === user.username.toLowerCase() && u.id !== user.id
  );

  if (existingByUsername) {
    return {
      success: false,
      message: `O nome de utilizador "${user.username}" já está a ser utilizado por outro pastor.`,
      users,
    };
  }

  const existingIndex = users.findIndex((u) => u.id === user.id);
  let updated: AppUser[];

  if (existingIndex >= 0) {
    updated = users.map((u) => (u.id === user.id ? user : u));
  } else {
    updated = [user, ...users];
  }

  saveStoredUsers(updated);
  syncUserToCloud(user).catch(console.error);
  return { success: true, message: 'Utilizador guardado com sucesso.', users: updated };
}

export function deleteUser(id: string): { success: boolean; message: string; users: AppUser[] } {
  const users = getStoredUsers();
  const target = users.find((u) => u.id === id);

  if (!target) {
    return { success: false, message: 'Utilizador não encontrado.', users };
  }

  if (target.username.toLowerCase() === 'administrador') {
    return { success: false, message: 'A conta de Administrador Geral não pode ser eliminada.', users };
  }

  const updated = users.filter((u) => u.id !== id);
  saveStoredUsers(updated);
  deleteUserFromCloud(id).catch(console.error);
  return { success: true, message: 'Utilizador removido com sucesso.', users: updated };
}

export function authenticateUser(username: string, pass: string): { success: boolean; user?: AppUser; message?: string } {
  const users = getStoredUsers();
  const cleanUser = username.trim().toLowerCase();
  const found = users.find((u) => u.username.toLowerCase() === cleanUser);

  if (!found) {
    return { success: false, message: 'Utilizador não encontrado no sistema.' };
  }

  if (found.password !== pass) {
    return { success: false, message: 'Senha incorreta. Por favor tente novamente.' };
  }

  // Create session
  const session: AuthSession = {
    user: found,
    token: 'token-' + Math.random().toString(36).substr(2) + Date.now().toString(36),
    loginAt: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

  return { success: true, user: found };
}

export function getCurrentSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function updateCurrentCredentials(
  userId: string,
  newUsername: string,
  newPassword: string,
  newNome?: string
): { success: boolean; message: string; updatedUser?: AppUser } {
  const users = getStoredUsers();
  const cleanUsername = newUsername.trim().toLowerCase();

  // Check collision
  const collision = users.find(
    (u) => u.username.toLowerCase() === cleanUsername && u.id !== userId
  );
  if (collision) {
    return { success: false, message: `O nome de utilizador "${newUsername}" já está em uso.` };
  }

  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: 'Utilizador não encontrado.' };
  }

  const target = users[userIndex];
  const updatedUser: AppUser = {
    ...target,
    username: newUsername.trim(),
    password: newPassword,
    nome: newNome ? newNome.trim() : target.nome,
    requiresPasswordChange: false,
  };

  users[userIndex] = updatedUser;
  saveStoredUsers(users);

  // Update current session
  const session = getCurrentSession();
  if (session && session.user.id === userId) {
    session.user = updatedUser;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  return { success: true, message: 'Credenciais atualizadas com sucesso!', updatedUser };
}
