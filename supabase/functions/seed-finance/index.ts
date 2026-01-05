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
    const financePassword = 'FIN@SrongPass\\'
    const financeUsername = 'financa@uni'
    const financeName = 'Gestor Financeiro'

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === financeEmail)

    if (existingUser) {
      if (resetPassword) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: financePassword,
        })
        if (updateError) {
          console.error('Erro ao redefinir senha do gestor financeiro:', updateError)
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
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: financeEmail,
      password: financePassword,
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

    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: newUser.user.id,
      role: 'finance',
    })

    if (roleError) {
      console.error('Erro ao atribuir papel ao Gestor Financeiro:', roleError)
      throw roleError
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
        password: financePassword,
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
