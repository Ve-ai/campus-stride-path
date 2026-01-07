import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminAccount {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role: "finance" | "coordinator" | "matricula";
}

const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    email: "financa@escola.local",
    password: "Fin@2025!",
    username: "financa",
    fullName: "Gestor Financeiro",
    role: "finance",
  },
  {
    email: "coordenador@escola.local",
    password: "Coord@2025!",
    username: "coordenador",
    fullName: "Coordenador de Curso",
    role: "coordinator",
  },
  {
    email: "matricula@escola.local",
    password: "Matr@2025!",
    username: "matricula",
    fullName: "Agente de Matrículas",
    role: "matricula",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Array<{
      role: string;
      username: string;
      password: string;
      status: "created" | "updated" | "error";
      error?: string;
    }> = [];

    for (const account of ADMIN_ACCOUNTS) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
          (u) => u.email === account.email
        );

        let userId: string;

        if (existingUser) {
          // Update password for existing user
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password: account.password }
          );

          if (updateError) throw updateError;
          userId = existingUser.id;

          results.push({
            role: account.role,
            username: account.username,
            password: account.password,
            status: "updated",
          });
        } else {
          // Create new user
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: account.email,
            password: account.password,
            email_confirm: true,
          });

          if (createError) throw createError;
          if (!newUser.user) throw new Error("Failed to create user");
          
          userId = newUser.user.id;

          // Create profile
          await supabaseAdmin.from("profiles").upsert({
            user_id: userId,
            full_name: account.fullName,
            username: account.username,
            must_change_password: true,
          });

          // Assign role
          await supabaseAdmin.from("user_roles").upsert({
            user_id: userId,
            role: account.role,
          });

          results.push({
            role: account.role,
            username: account.username,
            password: account.password,
            status: "created",
          });
        }

        // Ensure role is assigned
        const { data: existingRole } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", account.role)
          .maybeSingle();

        if (!existingRole) {
          await supabaseAdmin.from("user_roles").insert({
            user_id: userId,
            role: account.role,
          });
        }

        // Ensure profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!existingProfile) {
          await supabaseAdmin.from("profiles").insert({
            user_id: userId,
            full_name: account.fullName,
            username: account.username,
            must_change_password: true,
          });
        } else {
          await supabaseAdmin
            .from("profiles")
            .update({ username: account.username })
            .eq("user_id", userId);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        results.push({
          role: account.role,
          username: account.username,
          password: account.password,
          status: "error",
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        accounts: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});