import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Valida se quem está alterando é admin
    const { data: usuarioLogado } = await supabaseAdmin
      .from('usuarios')
      .select('empresa_id, is_admin')
      .eq('user_id', user.id)
      .single()

    if (!usuarioLogado?.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { membroId, userAuthId, novaSenha } = await req.json()

    if (!membroId || !userAuthId || !novaSenha) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
    }

    // Garante que o membro pertence à mesma empresa
    const { data: membro } = await supabaseAdmin
      .from('usuarios')
      .select('empresa_id')
      .eq('id', membroId)
      .single()

    if (!membro || membro.empresa_id !== usuarioLogado.empresa_id) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Atualiza a senha no Auth
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userAuthId, {
      password: novaSenha,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}