import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Allow CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Allow this specific function to be called without auth for initial setup
  // In production, you would want to add additional security measures

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Default super admin credentials
    const superAdminEmail = 'supadmin@escola.co.ao'
    const superAdminPassword = 'XyZ@2025StrongPass'
    const superAdminUsername = 'supadmin-001'
    const superAdminName = 'Administrador Supremo'

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === superAdminEmail)

    if (existingUser) {
      // Ensure role exists
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', existingUser.id)
        .eq('role', 'super_admin')
        .single()

      if (!existingRole) {
        await supabaseAdmin.from('user_roles').insert({
          user_id: existingUser.id,
          role: 'super_admin'
        })
      }

      return new Response(
        JSON.stringify({ 
          message: 'Super admin already exists', 
          email: superAdminEmail,
          username: superAdminUsername
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the super admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: superAdminEmail,
      password: superAdminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: superAdminName,
        username: superAdminUsername
      }
    })

    if (createError) {
      throw createError
    }

    // Assign super_admin role
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: newUser.user.id,
      role: 'super_admin'
    })

    if (roleError) {
      throw roleError
    }

    // Update profile with username
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        username: superAdminUsername,
        must_change_password: false 
      })
      .eq('user_id', newUser.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Super admin created successfully',
        email: superAdminEmail,
        username: superAdminUsername,
        password: superAdminPassword
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
