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
