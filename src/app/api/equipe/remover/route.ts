import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Valida se quem está removendo é admin
    const { data: usuarioLogado } = await supabaseAdmin
      .from('usuarios')
      .select('empresa_id, is_admin')
      .eq('user_id', user.id)
      .single()

    if (!usuarioLogado?.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { membroId, userAuthId } = await req.json()

    if (!membroId || !userAuthId) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Garante que o membro pertence à mesma empresa
    const { data: membro } = await supabaseAdmin
      .from('usuarios')
      .select('empresa_id, is_admin')
      .eq('id', membroId)
      .single()

    if (!membro || membro.empresa_id !== usuarioLogado.empresa_id) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    if (membro.is_admin) {
      return NextResponse.json({ error: 'Não é possível remover o administrador' }, { status: 403 })
    }

    // Remove da tabela usuarios
    await supabaseAdmin.from('usuarios').delete().eq('id', membroId)

    // Remove do Auth
    await supabaseAdmin.auth.admin.deleteUser(userAuthId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}