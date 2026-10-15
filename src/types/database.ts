export type UserRole = 'admin' | 'manager' | 'user' | 'editor' | 'viewer';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

// Funções utilitárias de permissão
export function canManageEmployees(role?: UserRole | null): boolean {
  return role === 'admin';
}

export function canManageTasks(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'manager' || role === 'editor';
}

export function isReadOnlyUser(role?: UserRole | null): boolean {
  return !canManageTasks(role);
}

export function getRoleLabel(role?: UserRole | null): string {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'manager':
    case 'editor':
      return 'Gestor de Tarefas';
    case 'user':
    case 'viewer':
    default:
      return 'Visualizador';
  }
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  execution_date: string; // YYYY-MM-DD
  responsible_user_id: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // Joins opcionais trazidos do Supabase
  responsible?: Pick<Profile, 'id' | 'full_name'> | null;
  creator?: Pick<Profile, 'id' | 'full_name'> | null;
}
