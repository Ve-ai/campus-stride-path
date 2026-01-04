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

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Parse request body
    let resetPassword = false
    try {
      const body = await req.json()
      resetPassword = body?.resetPassword === true
    } catch {
      // No body or invalid JSON, proceed with default
    }

    // Default super admin credentials
    const superAdminEmail = 'supadmin@escola.co.ao'
    const superAdminPassword = '@Lucidio4321'
    const superAdminUsername = 'Lucidio001'
    const superAdminName = 'Administrador Supremo'

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === superAdminEmail)

    if (existingUser) {
      console.log('Super admin found, checking role and profile...')
      
      // Update password if requested
      if (resetPassword) {
        console.log('Resetting password...')
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password: superAdminPassword }
        )
        
        if (updateError) {
          console.error('Password reset error:', updateError)
        }
      }

      // Ensure role exists
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', existingUser.id)
        .eq('role', 'super_admin')
        .maybeSingle()

      if (!existingRole) {
        console.log('Adding super_admin role...')
        await supabaseAdmin.from('user_roles').insert({
          user_id: existingUser.id,
          role: 'super_admin'
        })
      }

      // Ensure profile exists and is updated
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (!existingProfile) {
        console.log('Creating profile...')
        await supabaseAdmin.from('profiles').insert({
          user_id: existingUser.id,
          username: superAdminUsername,
          full_name: superAdminName,
          must_change_password: true,
          password_history: []
        })
      } else {
        console.log('Updating profile...')
        await supabaseAdmin.from('profiles')
          .update({
            username: superAdminUsername,
            full_name: superAdminName,
            must_change_password: true
          })
          .eq('user_id', existingUser.id)
      }

      return new Response(
        JSON.stringify({ 
          message: resetPassword ? 'Super admin password reset successfully' : 'Super admin already exists', 
          email: superAdminEmail,
          username: superAdminUsername,
          password: resetPassword ? superAdminPassword : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating new super admin user...')

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
      console.error('User creation error:', createError)
      throw createError
    }

    console.log('User created:', newUser.user.id)

    // Assign super_admin role
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: newUser.user.id,
      role: 'super_admin'
    })

    if (roleError) {
      console.error('Role assignment error:', roleError)
      throw roleError
    }

    console.log('Role assigned')

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ 
        user_id: newUser.user.id,
        username: superAdminUsername,
        full_name: superAdminName,
        must_change_password: true,
        password_history: []
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Try update if insert fails (profile might exist from trigger)
      await supabaseAdmin
        .from('profiles')
        .update({ 
          username: superAdminUsername,
          full_name: superAdminName,
          must_change_password: true
        })
        .eq('user_id', newUser.user.id)
    }

    console.log('Profile created')

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
