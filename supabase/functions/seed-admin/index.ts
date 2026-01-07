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
    let isInitialSetup = false
    try {
      const body = await req.json()
      isInitialSetup = body?.initialSetup === true
    } catch {
      // No body or invalid JSON, proceed with default
    }

    // Check if any super_admin exists
    const { data: existingRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin')
      .limit(1)

    const hasSuperAdmin = existingRoles && existingRoles.length > 0

    // If super admin exists, require authentication (except for initial setup when no admin exists)
    if (hasSuperAdmin && !isInitialSetup) {
      const authHeader = req.headers.get('Authorization')

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Não autorizado. Token de autenticação em falta.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
          auth: { autoRefreshToken: false, persistSession: false },
        }
      )

      const token = authHeader.replace('Bearer ', '')
      const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token)

      if (claimsError || !claims?.claims?.sub) {
        console.error('Erro ao validar token na função seed-admin:', claimsError)
        return new Response(
          JSON.stringify({ error: 'Não autorizado. Token inválido.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const userId = claims.claims.sub as string

      const { data: hasRole, error: roleError } = await supabaseAuth.rpc('has_role', {
        _user_id: userId,
        _role: 'super_admin',
      })

      if (roleError || !hasRole) {
        console.error('Utilizador sem permissão de super_admin para executar seed-admin:', roleError)
        return new Response(
          JSON.stringify({ error: 'Proibido. Apenas super administradores podem executar esta ação.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Credenciais padrão do super admin (fixas e conhecidas)
    const superAdminEmail = 'supadmin@escola.co.ao'
    const superAdminUsername = 'Lucidio001'
    const superAdminName = 'Administrador Supremo'
    const superAdminDefaultPassword = '@Lucidio4321'

    let passwordForResponse = superAdminDefaultPassword

    // Verificar se o utilizador já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === superAdminEmail)

    if (existingUser) {
      console.log('Super admin found, forcing password to default value...')

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: superAdminDefaultPassword,
      })

      if (updateError) {
        console.error('Password reset error:', updateError)
      }

      // Garantir que o papel existe
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
          role: 'super_admin',
        })
      }

      // Garantir que o perfil existe e está atualizado
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
          password_history: [],
        })
      } else {
        console.log('Updating profile...')
        await supabaseAdmin
          .from('profiles')
          .update({
            username: superAdminUsername,
            full_name: superAdminName,
            must_change_password: true,
          })
          .eq('user_id', existingUser.id)
      }

      return new Response(
        JSON.stringify({
          message: 'Super admin atualizado com senha padrão',
          email: superAdminEmail,
          username: superAdminUsername,
          password: passwordForResponse,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating new super admin user with default password...')

    // Criar o utilizador super admin
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: superAdminEmail,
      password: superAdminDefaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name: superAdminName,
        username: superAdminUsername,
      },
    })

    if (createError) {
      console.error('User creation error:', createError)
      throw createError
    }

    console.log('User created:', newUser.user.id)

    // Atribuir papel super_admin
    const { error: roleInsertError } = await supabaseAdmin.from('user_roles').insert({
      user_id: newUser.user.id,
      role: 'super_admin',
    })

    if (roleInsertError) {
      console.error('Role assignment error:', roleInsertError)
      throw roleInsertError
    }

    console.log('Role assigned')

    // Criar perfil
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      user_id: newUser.user.id,
      username: superAdminUsername,
      full_name: superAdminName,
      must_change_password: true,
      password_history: [],
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Tentar atualizar se o insert falhar (perfil pode existir via trigger)
      await supabaseAdmin
        .from('profiles')
        .update({
          username: superAdminUsername,
          full_name: superAdminName,
          must_change_password: true,
        })
        .eq('user_id', newUser.user.id)
    }

    console.log('Profile created')

    return new Response(
      JSON.stringify({
        message: 'Super admin criado com sucesso',
        email: superAdminEmail,
        username: superAdminUsername,
        password: passwordForResponse,
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
