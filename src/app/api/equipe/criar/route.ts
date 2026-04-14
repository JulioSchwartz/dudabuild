import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Valida o usuário logado
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Busca dados da empresa e valida se é admin Premium
    const { data: usuarioLogado } = await supabaseAdmin
      .from('usuarios')
      .select('empresa_id, is_admin, perfil')
      .eq('user_id', user.id)
      .single()

    if (!usuarioLogado?.is_admin || usuarioLogado?.perfil !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { data: empresa } = await supabaseAdmin
      .from('empresas')
      .select('plano, status')
      .eq('id', usuarioLogado.empresa_id)
      .single()

    if (empresa?.plano !== 'premium' || empresa?.status !== 'active') {
      return NextResponse.json({ error: 'Recurso disponível apenas no plano Premium' }, { status: 403 })
    }

    const { email, senha, perfil } = await req.json()

    if (!email || !senha || !perfil) {
      return NextResponse.json({ error: 'Email, senha e perfil são obrigatórios' }, { status: 400 })
    }

    if (!['engenheiro', 'mestre_obra', 'financeiro'].includes(perfil)) {
  return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
}

    if (senha.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
    }

    // Cria o usuário no Supabase Auth
    const { data: novoAuth, error: erroAuth } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // já confirma o email automaticamente
    })

    if (erroAuth) {
      if (erroAuth.message.includes('already registered')) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 400 })
      }
      return NextResponse.json({ error: erroAuth.message }, { status: 400 })
    }

    // Insere na tabela usuarios vinculado à empresa
    const { error: erroUsuario } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email,
        user_id: novoAuth.user.id,
        empresa_id: usuarioLogado.empresa_id,
        is_admin: false,
        perfil,
      })

    if (erroUsuario) {
      // Rollback: remove o usuário do Auth se falhou no banco
      await supabaseAdmin.auth.admin.deleteUser(novoAuth.user.id)
      return NextResponse.json({ error: 'Erro ao salvar usuário' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}