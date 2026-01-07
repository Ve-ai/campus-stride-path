import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Configuração do backend incompleta." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client com JWT do utilizador actual para obter o utilizador autenticado
    const authHeader = req.headers.get("Authorization");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader ?? "",
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error("User auth error", userError);
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client com Service Role para executar limpeza completa
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Garantir que apenas o super admin pode executar esta operação
    const { data: isSuperAdminData, error: roleError } = await adminClient
      .rpc("has_role", { _user_id: user.id, _role: "super_admin" });

    if (roleError || !isSuperAdminData) {
      console.error("Role check error", roleError);
      return new Response(JSON.stringify({ error: "Apenas o Administrador Supremo pode limpar os dados de exemplo." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Starting demo data reset by", user.id);

    // Apagar dados dependentes primeiro para respeitar as chaves estrangeiras
    const tablesInDeleteOrder = [
      "payments",
      "grades",
      "teacher_class_assignments",
      "students",
      "classes",
      "subjects",
      "courses",
      "teachers",
      "school_nuclei",
      "faltas_professores",
      "grade_change_requests",
      "configuracoes_faltas",
    ];

    for (const table of tablesInDeleteOrder) {
      console.log("Deleting from", table);
      const { error } = await adminClient.from(table).delete().neq("id", "");
      if (error) {
        console.error(`Error cleaning table ${table}:`, error.message);
      }
    }

    console.log("Demo data reset completed");

    return new Response(
      JSON.stringify({
        message:
          "Todos os dados de exemplo foram removidos. Permanecem apenas as contas de administração e finanças já configuradas.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Unexpected error in reset-demo function", err);
    return new Response(JSON.stringify({ error: "Erro inesperado ao limpar dados de exemplo." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
