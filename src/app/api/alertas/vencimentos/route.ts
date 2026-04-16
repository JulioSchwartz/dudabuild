import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function GET(req: NextRequest) {
  // Segurança: só permite chamada com token secreto (Vercel Cron)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const hoje = new Date()
    const em10 = new Date(hoje); em10.setDate(hoje.getDate() + 10)
    const em2  = new Date(hoje); em2.setDate(hoje.getDate() + 2)

    const fmt = (d: Date) => d.toISOString().split('T')[0]

    // Busca contas pendentes que vencem em 10 ou 2 dias
    const { data: contas } = await supabase
      .from('contas')
      .select('*, obras(nome), empresas(id, nome)')
      .eq('status', 'pendente')
      .or(`and(vencimento.eq.${fmt(em10)},alerta_10_enviado.eq.false),and(vencimento.eq.${fmt(em2)},alerta_2_enviado.eq.false)`)

    if (!contas || contas.length === 0) {
      return NextResponse.json({ ok: true, alertas: 0 })
    }

    let enviados = 0

    for (const conta of contas) {
      const diasRestantes = Math.round(
        (new Date(conta.vencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      )
      const ehAlerta10 = diasRestantes >= 9 && !conta.alerta_10_enviado
      const ehAlerta2  = diasRestantes <= 3 && !conta.alerta_2_enviado

      if (!ehAlerta10 && !ehAlerta2) continue

      // Busca emails dos usuários admin e financeiro da empresa
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('email, perfil')
        .eq('empresa_id', conta.empresa_id)
        .in('perfil', ['admin', 'financeiro'])

      if (!usuarios || usuarios.length === 0) continue

      const emails = usuarios.map(u => u.email)
      const tipo   = conta.tipo === 'pagar' ? '💸 Conta a Pagar' : '💰 Conta a Receber'
      const urgencia = diasRestantes <= 3 ? '🚨 URGENTE' : '⏰ Aviso'
      const corTipo = conta.tipo === 'pagar' ? '#ef4444' : '#16a34a'

      await resend.emails.send({
        from: 'Zynplan <noreply@zynplan.com.br>',
        to:   emails,
        subject: `${urgencia} — ${tipo} vence em ${diasRestantes} dia(s): ${conta.descricao}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f172a;color:#fff;border-radius:12px;">
            <h2 style="color:#d4a843;margin-bottom:8px;">${urgencia} de Vencimento</h2>
            <p style="color:#94a3b8;margin-bottom:24px;">Uma conta vence em <strong style="color:#fff;">${diasRestantes} dia(s)</strong>.</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8;width:140px;">Tipo</td>
                  <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-weight:700;color:${corTipo};">${tipo}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8;">Descrição</td>
                  <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-weight:600;">${conta.descricao}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8;">Obra</td>
                  <td style="padding:10px 0;border-bottom:1px solid #1e293b;">${(conta as any).obras?.nome || '—'}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8;">Valor</td>
                  <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-weight:700;font-size:18px;color:${corTipo};">
                    ${Number(conta.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td></tr>
              <tr><td style="padding:10px 0;color:#94a3b8;">Vencimento</td>
                  <td style="padding:10px 0;font-weight:600;">
                    ${new Date(conta.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td></tr>
            </table>
            <a href="https://app.zynplan.com.br/contas"
               style="display:inline-block;margin-top:24px;background:#d4a843;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
              Ver conta no Zynplan →
            </a>
          </div>
        `,
      })

      // Marca alerta como enviado
      await supabase
        .from('contas')
        .update({
          ...(ehAlerta10 ? { alerta_10_enviado: true } : {}),
          ...(ehAlerta2  ? { alerta_2_enviado:  true } : {}),
        })
        .eq('id', conta.id)

      enviados++
    }

    return NextResponse.json({ ok: true, alertas: enviados })

  } catch (err) {
    console.error('Erro alertas:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}