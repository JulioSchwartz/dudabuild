import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscription, empresa_id, usuario_id } = body

    console.log('[push/subscribe] recebido:', { empresa_id, usuario_id, subscription: !!subscription })

    if (!subscription || !empresa_id || !usuario_id) {
      console.error('[push/subscribe] dados inválidos:', { empresa_id, usuario_id, subscription: !!subscription })
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Remove subscription antiga do usuário se existir
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('usuario_id', usuario_id)

    // Insere nova subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({ empresa_id, usuario_id, subscription })

    if (error) {
      console.error('[push/subscribe] erro ao salvar:', error)
      throw error
    }

    console.log('[push/subscribe] salvo com sucesso para usuario_id:', usuario_id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/subscribe] erro geral:', err)
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