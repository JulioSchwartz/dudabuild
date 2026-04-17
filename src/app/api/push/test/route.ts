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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const empresa_id = searchParams.get('empresa_id')

    if (!empresa_id) {
      return NextResponse.json({ error: 'empresa_id obrigatório' }, { status: 400 })
    }

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('empresa_id', empresa_id)

    if (error) throw error

    if (!subs || subs.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        msg: 'Nenhuma subscription encontrada para esta empresa. A subscription foi salva corretamente?' 
      })
    }

    const payload = JSON.stringify({
      title: '🔔 Zynplan funcionando!',
      body:  'Notificações push ativas com sucesso.',
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      url:   '/dashboard',
    })

    const resultados = await Promise.allSettled(
      subs.map(s => webpush.sendNotification(s.subscription, payload))
    )

    const enviadas = resultados.filter(r => r.status === 'fulfilled').length
    const erros    = resultados
      .filter(r => r.status === 'rejected')
      .map((r: any) => r.reason?.message)

    return NextResponse.json({ ok: true, subs: subs.length, enviadas, erros })
  } catch (err: any) {
    console.error('[push/test]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}