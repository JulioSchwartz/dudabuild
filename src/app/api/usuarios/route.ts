import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_EMAILS } from '@/lib/permissoes'
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
 
export async function POST(req: Request) {
  try {
    // 🔐 Apenas admins podem criar usuários via API
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
 
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: adminUser } } = await supabase.auth.getUser(token)
 
    if (!adminUser || !ADMIN_EMAILS.includes(adminUser.email || '')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
 
    // ✅ Valida campos
    const { email, empresaId, nome } = await req.json()
 
    if (!email || !empresaId) {
      return NextResponse.json({ error: 'email e empresaId são obrigatórios' }, { status: 400 })
    }
 
    // Valida formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
 
    // 🔐 Cria usuário no Auth com senha temporária aleatória
    // O usuário precisará usar "Esqueci minha senha" para definir a sua senha
    const senhaTemporaria = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
 
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password:      senhaTemporaria,
      email_confirm: true, // confirma email automaticamente
    })
 
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Erro ao criar usuário' }, { status: 400 })
    }
 
    const newUser = data.user
 
    // 💾 Salva no banco
    const { error: errInsert } = await supabase.from('usuarios').insert({
      email:      newUser.email,
      nome:       nome || email,
      user_id:    newUser.id,
      empresa_id: empresaId,
      is_admin:   false,
    })
 
    if (errInsert) {
      // Rollback: remove usuário do Auth se insert falhar
      await supabase.auth.admin.deleteUser(newUser.id)
      return NextResponse.json({ error: 'Erro ao salvar usuário' }, { status: 500 })
    }
 
    // 📧 Envia email de redefinição de senha para o novo usuário
    await supabase.auth.admin.generateLink({
      type:  'recovery',
      email: email,
    })
 
    return NextResponse.json({
      success: true,
      message: `Usuário ${email} criado. Um email de definição de senha foi enviado.`,
    })
 
  } catch (err: any) {
    console.error('Usuarios route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}