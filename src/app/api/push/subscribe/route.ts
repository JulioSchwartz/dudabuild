import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { subscription, empresa_id, usuario_id } = await req.json()

    if (!subscription || !empresa_id || !usuario_id) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Upsert — evita duplicar subscription do mesmo usuário
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { empresa_id, usuario_id, subscription },
        { onConflict: 'usuario_id' }
      )

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/subscribe]', err)
    return NextResponse.json({ error: 'Erro ao salvar subscription' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { usuario_id } = await req.json()
    if (!usuario_id) return NextResponse.json({ error: 'usuario_id obrigatório' }, { status: 400 })

    await supabase.from('push_subscriptions').delete().eq('usuario_id', usuario_id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/subscribe DELETE]', err)
    return NextResponse.json({ error: 'Erro ao remover subscription' }, { status: 500 })
  }
}