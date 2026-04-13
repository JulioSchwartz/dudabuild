import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { email, password, nomeEmpresa } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    // 1. Cria o usuário no auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Supabase vai enviar o email de confirmação
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Este email já está cadastrado. Faça login.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const user = authData.user
    if (!user) {
      return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 })
    }

    // 2. Cria a empresa
    const { data: empresa, error: erroEmpresa } = await supabaseAdmin
      .from('empresas')
      .insert({
        nome: nomeEmpresa?.trim() || email,
        plano: 'basico',
        status: 'incomplete',
        trial_expira_em: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (erroEmpresa || !empresa) {
      // Rollback — deleta o usuário do auth
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return NextResponse.json({ error: 'Erro ao criar empresa.' }, { status: 500 })
    }

    // 3. Cria o registro na tabela usuarios
    const { error: erroUsuario } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email,
        user_id: user.id,
        empresa_id: empresa.id,
        is_admin: false,
      })

    if (erroUsuario) {
      // Rollback — deleta empresa e usuário do auth
      await supabaseAdmin.from('empresas').delete().eq('id', empresa.id)
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return NextResponse.json({ error: 'Erro ao vincular usuário.' }, { status: 500 })
    }

    // 4. Envia email de confirmação
    await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Erro cadastro:', err)
    return NextResponse.json({ error: 'Erro inesperado. Tente novamente.' }, { status: 500 })
  }
}