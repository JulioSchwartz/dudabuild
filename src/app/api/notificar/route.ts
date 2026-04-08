import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
 
export async function POST(req: Request) {
  try {
    // 🔐 Verifica autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
 
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
 
    if (!user) {
      return NextResponse.json({ error: 'Usuário inválido' }, { status: 401 })
    }
 
    // ✅ Valida campos
    const body = await req.json()
    const { id, status } = body
 
    if (!id || !status) {
      return NextResponse.json({ error: 'Campos id e status são obrigatórios' }, { status: 400 })
    }
 
    const statusValidos = ['aprovado', 'recusado', 'pendente', 'visualizado']
    if (!statusValidos.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }
 
    console.log(`Orçamento ${id} atualizado para: ${status} por ${user.email}`)
 
    // 👉 Extensão futura: WhatsApp / Email / Push
    // await enviarWhatsApp(...)
    // await enviarEmail(...)
 
    return NextResponse.json({ ok: true })
 
  } catch (err: any) {
    console.error('Notificar error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}