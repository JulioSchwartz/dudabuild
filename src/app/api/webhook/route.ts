import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRICE_PARA_PLANO: Record<string, string> = {
  'price_1TJg7cFjaswz9WcmjuSi3KLQ': 'basico',
  'price_1TJg8HFjaswz9WcmLtUD1Wzk': 'pro',
  'price_1TJg99Fjaswz9WcmOhX7PsvZ': 'premium',
}

const PLANO_LABEL: Record<string, string> = {
  basico:  'Básico — R$ 79,90/mês',
  pro:     'Pro — R$ 149,90/mês',
  premium: 'Premium — R$ 299,90/mês',
}

async function notificar(assunto: string, corpo: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!)
    await resend.emails.send({
      from: 'Zynplan <noreply@zynplan.com.br>',
      to:   ['suportezynplan@gmail.com'],
      subject: assunto,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f172a;color:#fff;border-radius:12px;">
          <h2 style="color:#d4a843;margin-bottom:24px;">${assunto}</h2>
          ${corpo}
          <p style="margin-top:24px;font-size:12px;color:#475569;">
            ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Erro ao enviar notificação:', err)
  }
}

function linhaTabela(label: string, valor: string) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1e293b;color:#94a3b8;width:160px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-weight:600;">${valor}</td>
    </tr>
  `
}

function tabelaHtml(linhas: string) {
  return `<table style="width:100%;border-collapse:collapse;">${linhas}</table>`
}
 
export async function POST(req: Request) {
  const body = await req.text()
  const sig  = headers().get('stripe-signature')
 
  if (!sig) {
    return new Response('Sem assinatura Stripe', { status: 400 })
  }
 
  let event: Stripe.Event
 
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
 
  try {
 
    // ✅ PAGAMENTO CONFIRMADO
    if (event.type === 'checkout.session.completed') {
      const session      = event.data.object as Stripe.Checkout.Session
      const customerId   = session.customer as string
      const subscriptionId = session.subscription as string
 
      // Pega o price ID dos line items para determinar o plano
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      const priceId   = lineItems.data[0]?.price?.id || ''
      const plano     = PRICE_PARA_PLANO[priceId] || 'basico'
 
      // 🔑 Estratégia: usa empresa_id da metadata (mais confiável)
      //    Se não tiver, cai para stripe_customer_id
      const empresaId = session.metadata?.empresa_id
 
      if (empresaId) {
        await supabase
          .from('empresas')
          .update({
            stripe_customer_id:      customerId,
            stripe_subscription_id:  subscriptionId,
            status: 'active',
            plano,
          })
          .eq('id', empresaId)
      } else {
        // Fallback: busca pela customer_id (clientes já existentes)
        await supabase
          .from('empresas')
          .update({
            stripe_subscription_id: subscriptionId,
            status: 'active',
            plano,
          })
          .eq('stripe_customer_id', customerId)
      }
 
      console.log(`✅ Empresa ativada: ${empresaId || customerId} → plano ${plano}`)

      // Busca email da empresa para notificar
      const { data: empresaData } = await supabase
        .from('empresas').select('nome').eq('id', empresaId || '').maybeSingle()
      const { data: usuarioData } = await supabase
        .from('usuarios').select('email').eq('empresa_id', empresaId || '').eq('is_admin', true).maybeSingle()

      await notificar(`💳 Nova assinatura: ${empresaData?.nome || customerId}`, tabelaHtml(
        linhaTabela('Empresa', empresaData?.nome || '—') +
        linhaTabela('E-mail', usuarioData?.email || '—') +
        linhaTabela('Plano contratado', PLANO_LABEL[plano] || plano) +
        linhaTabela('Status', '✅ Ativo')
      ))
    }
 
    // ✅ ASSINATURA ATUALIZADA (upgrade/downgrade)
    if (event.type === 'customer.subscription.updated') {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const priceId    = sub.items.data[0]?.price?.id || ''
      const plano      = PRICE_PARA_PLANO[priceId] || 'basico'
      const status     = sub.status === 'active' ? 'active' : 'past_due'
 
      const empresaId = sub.metadata?.empresa_id
 
      if (empresaId) {
        await supabase
          .from('empresas')
          .update({ plano, status })
          .eq('id', empresaId)
      } else {
        await supabase
          .from('empresas')
          .update({ plano, status })
          .eq('stripe_customer_id', customerId)
      }
 
      console.log(`🔄 Assinatura atualizada: ${empresaId || customerId} → ${plano} / ${status}`)

      const { data: empresaUpd } = await supabase
        .from('empresas').select('nome').eq('id', empresaId || '').maybeSingle()
      const { data: usuarioUpd } = await supabase
        .from('usuarios').select('email').eq('empresa_id', empresaId || '').eq('is_admin', true).maybeSingle()

      await notificar(`🔄 Plano atualizado: ${empresaUpd?.nome || customerId}`, tabelaHtml(
        linhaTabela('Empresa', empresaUpd?.nome || '—') +
        linhaTabela('E-mail', usuarioUpd?.email || '—') +
        linhaTabela('Novo plano', PLANO_LABEL[plano] || plano) +
        linhaTabela('Status', status === 'active' ? '✅ Ativo' : '⚠️ Inadimplente')
      ))
    }
 
    // ⚠️ PAGAMENTO FALHOU
    if (event.type === 'invoice.payment_failed') {
      const invoice    = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
 
      await supabase
        .from('empresas')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', customerId)
 
      console.log(`⚠️ Pagamento falhou: ${customerId}`)

      const { data: empresaFail } = await supabase
        .from('empresas').select('nome, id').eq('stripe_customer_id', customerId).maybeSingle()
      const { data: usuarioFail } = await supabase
        .from('usuarios').select('email').eq('empresa_id', empresaFail?.id || '').eq('is_admin', true).maybeSingle()

      await notificar(`⚠️ Pagamento falhou: ${empresaFail?.nome || customerId}`, tabelaHtml(
        linhaTabela('Empresa', empresaFail?.nome || '—') +
        linhaTabela('E-mail', usuarioFail?.email || '—') +
        linhaTabela('Status', '⚠️ Inadimplente') +
        linhaTabela('Ação', 'Cliente foi bloqueado — aguardando pagamento')
      ))
    }
 
    // ❌ ASSINATURA CANCELADA
    if (event.type === 'customer.subscription.deleted') {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const empresaId  = sub.metadata?.empresa_id
 
      if (empresaId) {
        await supabase
          .from('empresas')
          .update({ status: 'canceled', plano: 'basico' })
          .eq('id', empresaId)
      } else {
        await supabase
          .from('empresas')
          .update({ status: 'canceled', plano: 'basico' })
          .eq('stripe_customer_id', customerId)
      }
 
      console.log(`❌ Assinatura cancelada: ${empresaId || customerId}`)

      const { data: empresaCan } = await supabase
        .from('empresas').select('nome').eq('id', empresaId || '').maybeSingle()
      const { data: usuarioCan } = await supabase
        .from('usuarios').select('email').eq('empresa_id', empresaId || '').eq('is_admin', true).maybeSingle()

      await notificar(`❌ Assinatura cancelada: ${empresaCan?.nome || customerId}`, tabelaHtml(
        linhaTabela('Empresa', empresaCan?.nome || '—') +
        linhaTabela('E-mail', usuarioCan?.email || '—') +
        linhaTabela('Status', '❌ Cancelado') +
        linhaTabela('Plano', 'Revertido para Básico')
      ))
    }
 
  } catch (err) {
    console.error('Webhook processing error:', err)
    // Retorna 200 mesmo com erro interno para o Stripe não reenviar
    // O erro já foi logado para investigação
  }
 
  return new Response('OK', { status: 200 })
}