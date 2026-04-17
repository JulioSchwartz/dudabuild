import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function GET(req: NextRequest) {
  // Verifica CRON_SECRET
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const hoje = new Date()

    const em10Dias = new Date(hoje)
    em10Dias.setDate(em10Dias.getDate() + 10)

    const em2Dias = new Date(hoje)
    em2Dias.setDate(em2Dias.getDate() + 2)

    const fmt = (d: Date) => d.toISOString().split('T')[0]

    // Busca contas vencendo em 10 dias (não alertadas ainda)
    const { data: contas10 } = await supabase
      .from('contas')
      .select('*, empresas(id, nome), obras(nome)')
      .eq('status', 'pendente')
      .eq('vencimento', fmt(em10Dias))
      .eq('alerta_10_enviado', false)

    // Busca contas vencendo em 2 dias (não alertadas ainda)
    const { data: contas2 } = await supabase
      .from('contas')
      .select('*, empresas(id, nome), obras(nome)')
      .eq('status', 'pendente')
      .eq('vencimento', fmt(em2Dias))
      .eq('alerta_2_enviado', false)

    let totalAlertas = 0

    async function processarContas(contas: any[], diasRestantes: number, campoAlerta: string) {
      if (!contas || contas.length === 0) return

      for (const conta of contas) {
        const empresaId = conta.empresa_id
        const nomeObra  = conta.obras?.nome || 'Sem obra'
        const valor     = Number(conta.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        const titulo    = `⚠️ Conta vencendo em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}!`
        const mensagem  = `${conta.descricao} — ${valor} · ${nomeObra}`

        // 1. Busca usuários admin e financeiro da empresa para email
        const { data: usuarios } = await supabase
          .from('usuarios')
          .select('email')
          .eq('empresa_id', empresaId)
          .in('perfil', ['admin', 'financeiro'])

        // 2. Envia email
        if (usuarios && usuarios.length > 0) {
          const emails = usuarios.map((u: any) => u.email)
          await resend.emails.send({
            from:    'Zynplan <noreply@zynplan.com.br>',
            to:      emails,
            subject: titulo,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2 style="color:#dc2626">${titulo}</h2>
                <p><strong>${conta.descricao}</strong></p>
                <p>Valor: <strong>${valor}</strong></p>
                <p>Obra: ${nomeObra}</p>
                <p>Vencimento: <strong>${new Date(conta.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></p>
                <a href="https://app.zynplan.com.br/contas" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">
                  Ver conta →
                </a>
              </div>
            `,
          })
        }

        // 3. Envia push notification
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('empresa_id', empresaId)

        if (subs && subs.length > 0) {
          const payload = JSON.stringify({
            title: titulo,
            body:  mensagem,
            icon:  '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            url:   '/contas',
          })

          await Promise.allSettled(
            subs.map((s: any) => webpush.sendNotification(s.subscription, payload))
          )
        }

        // 4. Marca como alertada
        await supabase
          .from('contas')
          .update({ [campoAlerta]: true })
          .eq('id', conta.id)

        totalAlertas++
      }
    }

    await processarContas(contas10 || [], 10, 'alerta_10_enviado')
    await processarContas(contas2  || [], 2,  'alerta_2_enviado')

    console.log(`[alertas/vencimentos] total alertas enviados: ${totalAlertas}`)
    return NextResponse.json({ ok: true, totalAlertas })

  } catch (err) {
    console.error('[alertas/vencimentos]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}