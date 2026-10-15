import { createClient } from '@supabase/supabase-js';

/**
 * Cria um cliente Supabase com permissões administrativas se SUPABASE_SERVICE_ROLE_KEY
 * estiver definida, ou cliente com contexto isolado (sem persistência de sessão de navegador).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Fallback caso a chave de serviço ainda não tenha sido adicionada ao .env.local
  return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
