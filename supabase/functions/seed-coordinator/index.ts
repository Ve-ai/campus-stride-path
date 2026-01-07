import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if coordinator already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", "coordenador")
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Coordenador já existe. Use as credenciais: coordenador / Coord@2025",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: "coordenador@escola.local",
      password: "Coord@2025",
      email_confirm: true,
      user_metadata: {
        full_name: "Coordenador de Curso",
      },
    });

    if (authError) throw authError;

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: authUser.user.id,
      username: "coordenador",
      full_name: "Coordenador de Curso",
      must_change_password: false,
    });

    if (profileError) throw profileError;

    // Assign coordinator role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authUser.user.id,
      role: "coordinator",
    });

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Coordenador criado com sucesso! Login: coordenador | Senha: Coord@2025",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
