'use server';

import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UserRole, canManageEmployees } from '@/types/database';

export interface CreateCollaboratorInput {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface CreateCollaboratorResult {
  success: boolean;
  error?: string;
  warning?: string;
  userId?: string;
}

export async function createCollaboratorAction(
  input: CreateCollaboratorInput
): Promise<CreateCollaboratorResult> {
  // 1. Verifica se o usuário que está chamando a ação está autenticado
  const userSupabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Sessão inválida ou usuário não autenticado.' };
  }

  // 2. Valida se o usuário autenticado é admin (apenas admin cadastra funcionários)
  const { data: profile, error: profileError } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !canManageEmployees(profile?.role)) {
    return {
      success: false,
      error: 'Permissão negada: apenas administradores podem cadastrar novos funcionários.',
    };
  }

  // 3. Validação dos campos
  const fullName = input.fullName?.trim();
  const email = input.email?.trim().toLowerCase();
  const password = input.password?.trim();
  const role = input.role || 'user';

  if (!fullName || !email || !password) {
    return { success: false, error: 'Preencha o nome completo, e-mail e a senha inicial.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
  }

  const adminClient = createAdminClient();
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (hasServiceKey) {
      // Criação administrativa direta (auto-confirmado, sem envio de e-mail e sem limites)
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (createError) {
        return { success: false, error: createError.message };
      }

      // Garante a criação/atualização na tabela public.profiles
      if (newUser?.user) {
        await adminClient.from('profiles').upsert({
          id: newUser.user.id,
          full_name: fullName,
          role,
        });
      }

      return { success: true, userId: newUser?.user?.id };
    } else {
      // Fallback em cliente isolado caso a chave service_role ainda não esteja configurada no .env.local
      const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        return { success: false, error: signUpError.message };
      }

      if (signUpData?.user && role !== 'user') {
        await adminClient
          .from('profiles')
          .update({ role })
          .eq('id', signUpData.user.id);
      }

      return {
        success: true,
        userId: signUpData?.user?.id,
        warning:
          'Funcionário criado! Para ativação imediata sem necessidade de confirmação por e-mail, adicione SUPABASE_SERVICE_ROLE_KEY no .env.local.',
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro inesperado ao cadastrar funcionário.';
    return { success: false, error: message };
  }
}

/**
 * Busca a lista completa de funcionários com e-mail e contagem de tarefas (Apenas Admin)
 */
export async function getCollaboratorsListAction(): Promise<{
  success: boolean;
  collaborators?: import('@/types/database').CollaboratorWithEmail[];
  error?: string;
}> {
  const userSupabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Sessão inválida ou usuário não autenticado.' };
  }

  const { data: profile, error: profileError } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !canManageEmployees(profile?.role)) {
    return {
      success: false,
      error: 'Permissão negada: apenas administradores podem visualizar a gestão de funcionários.',
    };
  }

  const adminClient = createAdminClient();

  try {
    const [
      { data: profiles, error: profilesError },
      { data: usersData },
      { data: tasks },
    ] = await Promise.all([
      adminClient.from('profiles').select('*').order('full_name', { ascending: true }),
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
      adminClient.from('tasks').select('responsible_user_id'),
    ]);

    if (profilesError) {
      return { success: false, error: profilesError.message };
    }

    const emailMap = new Map<string, string>();
    if (usersData?.users) {
      usersData.users.forEach((u) => {
        if (u.email) emailMap.set(u.id, u.email);
      });
    }

    const taskCountMap = new Map<string, number>();
    if (tasks) {
      tasks.forEach((t) => {
        if (t.responsible_user_id) {
          taskCountMap.set(
            t.responsible_user_id,
            (taskCountMap.get(t.responsible_user_id) || 0) + 1
          );
        }
      });
    }

    const collaborators = (profiles || []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) || '',
      tasksCount: taskCountMap.get(p.id) || 0,
    }));

    return { success: true, collaborators };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar funcionários.';
    return { success: false, error: message };
  }
}

export interface UpdateCollaboratorInput {
  id: string;
  fullName: string;
  role: UserRole;
  email?: string;
  password?: string;
}

/**
 * Atualiza os dados de um funcionário (Nome, Cargo, Senha, E-mail) - Apenas Admin
 */
export async function updateCollaboratorAction(
  input: UpdateCollaboratorInput
): Promise<{ success: boolean; error?: string }> {
  const userSupabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Sessão inválida ou usuário não autenticado.' };
  }

  const { data: callerProfile, error: profileError } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !canManageEmployees(callerProfile?.role)) {
    return {
      success: false,
      error: 'Permissão negada: apenas administradores podem editar funcionários.',
    };
  }

  const id = input.id;
  const fullName = input.fullName?.trim();
  const role = input.role;
  const email = input.email?.trim().toLowerCase();
  const password = input.password?.trim();

  if (!id || !fullName) {
    return { success: false, error: 'O nome completo é obrigatório.' };
  }

  // Previne que o administrador remova seu próprio papel de administrador
  if (user.id === id && role !== 'admin') {
    return {
      success: false,
      error: 'Você não pode remover seu próprio cargo de Administrador.',
    };
  }

  const adminClient = createAdminClient();

  try {
    // 1. Atualiza na tabela public.profiles
    const { error: updateProfileError } = await adminClient
      .from('profiles')
      .update({
        full_name: fullName,
        role: role,
      })
      .eq('id', id);

    if (updateProfileError) {
      return { success: false, error: updateProfileError.message };
    }

    // 2. Atualiza em auth.users se necessário
    const authUpdates: {
      password?: string;
      email?: string;
      email_confirm?: boolean;
      user_metadata?: { full_name: string };
    } = {
      user_metadata: { full_name: fullName },
    };

    if (password) {
      if (password.length < 6) {
        return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
      }
      authUpdates.password = password;
    }

    if (email) {
      authUpdates.email = email;
      authUpdates.email_confirm = true;
    }

    const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(
      id,
      authUpdates
    );

    if (updateAuthError) {
      return { success: false, error: updateAuthError.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar funcionário.';
    return { success: false, error: message };
  }
}

/**
 * Exclui um funcionário e suas tarefas atribuídas (Apenas Admin)
 */
export async function deleteCollaboratorAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const userSupabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Sessão inválida ou usuário não autenticado.' };
  }

  const { data: callerProfile, error: profileError } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !canManageEmployees(callerProfile?.role)) {
    return {
      success: false,
      error: 'Permissão negada: apenas administradores podem excluir funcionários.',
    };
  }

  if (user.id === id) {
    return {
      success: false,
      error: 'Você não pode excluir sua própria conta de administrador.',
    };
  }

  const adminClient = createAdminClient();

  try {
    // 1. Remove tarefas associadas ao usuário
    await adminClient.from('tasks').delete().eq('responsible_user_id', id);
    await adminClient.from('tasks').delete().eq('created_by_user_id', id);

    // 2. Remove da tabela public.profiles
    await adminClient.from('profiles').delete().eq('id', id);

    // 3. Remove do auth.users
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id);
    if (deleteAuthError) {
      return { success: false, error: deleteAuthError.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir funcionário.';
    return { success: false, error: message };
  }
}
