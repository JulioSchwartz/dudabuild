import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
 
// ⚠️ Mantenha sincronizado com planos/page.tsx e api/checkout/route.ts
const PRICE_PARA_PLANO: Record<string, string> = {
  'price_1TJg7cFjaswz9WcmjuSi3KLQ': 'basico',  
  'price_1TJg8HFjaswz9WcmLtUD1Wzk':  'pro',
  'price_1TJg99Fjaswz9WcmOhX7PsvZ':  'premium',
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
    }
 
  } catch (err) {
    console.error('Webhook processing error:', err)
    // Retorna 200 mesmo com erro interno para o Stripe não reenviar
    // O erro já foi logado para investigação
  }
 
  return new Response('OK', { status: 200 })
}