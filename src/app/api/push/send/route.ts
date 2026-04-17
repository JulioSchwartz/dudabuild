import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { empresa_id, titulo, mensagem, url } = await req.json()

    if (!empresa_id || !titulo || !mensagem) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Busca todas as subscriptions da empresa
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('empresa_id', empresa_id)

    if (error) throw error
    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, enviadas: 0 })
    }

    const payload = JSON.stringify({
      title: titulo,
      body:  mensagem,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      url:   url || '/dashboard',
    })

    const resultados = await Promise.allSettled(
      subs.map(s => webpush.sendNotification(s.subscription, payload))
    )

    const enviadas = resultados.filter(r => r.status === 'fulfilled').length
    const falhas   = resultados.filter(r => r.status === 'rejected').length

    console.log(`[push/send] empresa=${empresa_id} enviadas=${enviadas} falhas=${falhas}`)

    return NextResponse.json({ ok: true, enviadas, falhas })
  } catch (err) {
    console.error('[push/send]', err)
    return NextResponse.json({ error: 'Erro ao enviar notificação' }, { status: 500 })
  }
}