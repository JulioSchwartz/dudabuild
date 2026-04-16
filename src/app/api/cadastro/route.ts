import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { email, password, nomeEmpresa } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    // 1. Cria o usuário no auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Supabase vai enviar o email de confirmação
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Este email já está cadastrado. Faça login.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const user = authData.user
    if (!user) {
      return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 })
    }

    // 2. Cria a empresa
    const { data: empresa, error: erroEmpresa } = await supabaseAdmin
      .from('empresas')
      .insert({
        nome: nomeEmpresa?.trim() || email,
        plano: 'basico',
        status: 'incomplete',
        trial_expira_em: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (erroEmpresa || !empresa) {
      // Rollback — deleta o usuário do auth
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return NextResponse.json({ error: 'Erro ao criar empresa.' }, { status: 500 })
    }

    // 3. Cria o registro na tabela usuarios
    const { error: erroUsuario } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email,
        user_id: user.id,
        empresa_id: empresa.id,
        is_admin: false,
      })

    if (erroUsuario) {
      // Rollback — deleta empresa e usuário do auth
      await supabaseAdmin.from('empresas').delete().eq('id', empresa.id)
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return NextResponse.json({ error: 'Erro ao vincular usuário.' }, { status: 500 })
    }

    // 4. Envia email de confirmação
    await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
    })

    // 5. Notifica você sobre o novo cadastro
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!)
      await resend.emails.send({
        from: 'Zynplan <noreply@zynplan.com.br>',
        to: ['suportezynplan@gmail.com'],
        subject: `🎉 Novo cadastro: ${nomeEmpresa || email}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #fff; border-radius: 12px;">
            <h2 style="color: #d4a843; margin-bottom: 24px;">🎉 Novo cadastro na Zynplan!</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; width: 140px;">Empresa</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; font-weight: 600;">${nomeEmpresa || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8;">E-mail</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; font-weight: 600;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8;">Plano</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; font-weight: 600;">Trial Premium (14 dias)</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #94a3b8;">Data</td>
                <td style="padding: 12px 0; font-weight: 600;">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td>
              </tr>
            </table>
            <a href="https://wa.me/55${email}?text=Ol%C3%A1%2C%20seja%20bem-vindo%20%C3%A0%20Zynplan!%20Sou%20o%20J%C3%BAlio%2C%20fundador%20da%20plataforma.%20Posso%20te%20ajudar%20com%20alguma%20d%C3%BAvida%3F"
               style="display: inline-block; margin-top: 24px; background: #d4a843; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700;">
              Ver painel Zynplan →
            </a>
          </div>
        `,
      })
    } catch (emailErr) {
      // Não falha o cadastro se o email de notificação falhar
      console.error('Erro ao enviar notificação de cadastro:', emailErr)
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Erro cadastro:', err)
    return NextResponse.json({ error: 'Erro inesperado. Tente novamente.' }, { status: 500 })
  }
}