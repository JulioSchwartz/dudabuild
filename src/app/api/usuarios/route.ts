import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, empresaId } = await req.json()

  if (!email || !empresaId) {
    return new Response(JSON.stringify({ error: 'Dados inválidos' }), { status: 400 })
  }

  // 🔐 cria usuário no AUTH
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: '123456',
    email_confirm: true,
  })

  if (error || !data.user) {
    return new Response(JSON.stringify({ error: error?.message }), { status: 400 })
  }

  const user = data.user

  // 💾 salva no banco
  await supabase.from('usuarios').insert({
    email: user.email,
    user_id: user.id,
    empresa_id: empresaId
  })

  return new Response(JSON.stringify({ success: true }))
}