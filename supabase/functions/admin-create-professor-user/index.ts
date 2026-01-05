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

    const body = await req.json().catch(() => null)

    if (!body || !body.email || !body.password) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros inválidos. É necessário enviar email e password.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, full_name, username } = body as {
      email: string
      password: string
      full_name?: string
      username?: string
    }

    console.log('Criando utilizador de professor via função admin-create-professor-user...', {
      email,
      username,
    })

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        username,
      },
    })

    if (createError) {
      console.error('Erro ao criar utilizador de professor:', createError)
      return new Response(
        JSON.stringify({ error: createError.message || 'Falha ao criar utilizador.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!newUser || !newUser.user) {
      console.error('Resposta inesperada ao criar utilizador de professor:', newUser)
      return new Response(
        JSON.stringify({ error: 'Resposta inesperada ao criar utilizador.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Utilizador de professor criado com sucesso:', newUser.user.id)

    return new Response(
      JSON.stringify({ user_id: newUser.user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro inesperado na função admin-create-professor-user:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
