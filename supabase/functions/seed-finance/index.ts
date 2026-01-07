import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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
      console.error('Erro ao validar token na função seed-finance:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Token inválido.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claims.claims.sub as string

    const { data: hasRole, error: hasRoleError } = await supabaseAuth.rpc('has_role', {
      _user_id: userId,
      _role: 'super_admin',
    })

    if (hasRoleError || !hasRole) {
      console.error('Utilizador sem permissão de super_admin para executar seed-finance:', hasRoleError)
      return new Response(
        JSON.stringify({ error: 'Proibido. Apenas super administradores podem executar esta ação.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let resetPassword = false
    try {
      const body = await req.json()
      resetPassword = body?.resetPassword === true
    } catch {
      // ignore body errors
    }

    const financeEmail = 'financa@uni'
    const financeUsername = 'financa@uni'
    const financeName = 'Gestor Financeiro'

    let generatedPasswordForResponse: string | undefined

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === financeEmail)

    if (existingUser) {
      if (resetPassword) {
        const newPassword = crypto.randomUUID() + '!As1'
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: newPassword,
        })
        if (updateError) {
          console.error('Erro ao redefinir senha do gestor financeiro:', updateError)
        } else {
          generatedPasswordForResponse = newPassword
        }
      }

      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', existingUser.id)
        .eq('role', 'finance')
        .maybeSingle()

      if (!existingRole) {
        await supabaseAdmin.from('user_roles').insert({
          user_id: existingUser.id,
          role: 'finance',
        })
      }

      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (!existingProfile) {
        await supabaseAdmin.from('profiles').insert({
          user_id: existingUser.id,
          username: financeUsername,
          full_name: financeName,
          must_change_password: true,
          password_history: [],
        })
      } else {
        await supabaseAdmin
          .from('profiles')
          .update({
            username: financeUsername,
            full_name: financeName,
            must_change_password: true,
          })
          .eq('user_id', existingUser.id)
      }

      return new Response(
        JSON.stringify({
          message: resetPassword
            ? 'Gestor Financeiro atualizado com nova senha'
            : 'Gestor Financeiro já existe',
          email: financeEmail,
          username: financeUsername,
          password: generatedPasswordForResponse,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const initialPassword = crypto.randomUUID() + '!As1'

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: financeEmail,
      password: initialPassword,
      email_confirm: true,
      user_metadata: {
        full_name: financeName,
        username: financeUsername,
      },
    })

    if (createError) {
      console.error('Erro ao criar Gestor Financeiro:', createError)
      throw createError
    }

    const { error: roleInsertError } = await supabaseAdmin.from('user_roles').insert({
      user_id: newUser.user.id,
      role: 'finance',
    })

    if (roleInsertError) {
      console.error('Erro ao atribuir papel ao Gestor Financeiro:', roleInsertError)
      throw roleInsertError
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      user_id: newUser.user.id,
      username: financeUsername,
      full_name: financeName,
      must_change_password: true,
      password_history: [],
    })

    if (profileError) {
      console.error('Erro ao criar perfil do Gestor Financeiro:', profileError)
      await supabaseAdmin
        .from('profiles')
        .update({
          username: financeUsername,
          full_name: financeName,
          must_change_password: true,
        })
        .eq('user_id', newUser.user.id)
    }

    return new Response(
      JSON.stringify({
        message: 'Gestor Financeiro criado com sucesso',
        email: financeEmail,
        username: financeUsername,
        password: initialPassword,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro na função seed-finance:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
