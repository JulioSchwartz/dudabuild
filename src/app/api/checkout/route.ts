import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
 
// Price IDs válidos — mantenha sincronizado com planos/page.tsx
const PRICE_IDS_VALIDOS = [
  'price_1TJg7cFjaswz9WcmjuSi3KLQ', 
  'price_1TJg8HFjaswz9WcmLtUD1Wzk',
  'price_1TJg99Fjaswz9WcmOhX7PsvZ',
]
 
export async function POST(req: Request) {
  try {
    const { priceId } = await req.json()
 
    // ✅ Valida o priceId recebido
    if (!priceId || !PRICE_IDS_VALIDOS.includes(priceId)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }
 
    // 🔐 Autentica via token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
 
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
 
    if (!user) {
      return NextResponse.json({ error: 'Usuário inválido' }, { status: 401 })
    }
 
    // 🔎 Busca empresa do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .maybeSingle()
 
    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 })
    }
 
    const { data: empresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', usuario.empresa_id)
      .maybeSingle()
 
    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 })
    }
 
    // 👤 Cria ou reutiliza customer no Stripe
    let customerId = empresa.stripe_customer_id
 
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { empresa_id: usuario.empresa_id },
      })
 
      customerId = customer.id
 
      await supabase
        .from('empresas')
        .update({ stripe_customer_id: customerId })
        .eq('id', usuario.empresa_id)
    }
 
    // 💳 Cria sessão de checkout
    const session = await stripe.checkout.sessions.create({
      mode:     'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // Passa empresa_id como metadata para o webhook usar
      metadata: { empresa_id: usuario.empresa_id },
      subscription_data: {
        metadata: { empresa_id: usuario.empresa_id },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?sucesso=1`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/planos`,
    })
 
    return NextResponse.json({ url: session.url })
 
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}