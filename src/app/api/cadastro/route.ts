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
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({
          error: 'Este e-mail já está cadastrado em um produto Zyncompany. Use outro e-mail para realizar o cadastro.'
        }, { status: 409 })
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
      await supabaseAdmin.from('empresas').delete().eq('id', empresa.id)
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      return NextResponse.json({ error: 'Erro ao vincular usuário.' }, { status: 500 })
    }

    // 4. Gera sessão para login automático
    const { data: sessionData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    const resend = new Resend(process.env.RESEND_API_KEY!)

    // 5. Email de boas-vindas
    try {
      await resend.emails.send({
        from: 'Zynplan <noreply@zyncompany.com.br>',
        to: [email],
        subject: `Bem-vindo à Zynplan, ${nomeEmpresa || ''}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #fff; border-radius: 12px;">
            <h2 style="color: #d4a843; margin-bottom: 8px;">Bem-vindo à Zynplan! 🎉</h2>
            <p style="color: #94a3b8; margin-bottom: 24px;">Sua conta foi criada com sucesso. Você tem <strong style="color:#fff;">14 dias de trial gratuito</strong> no plano Premium.</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; width: 140px;">Empresa</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; font-weight: 600;">${nomeEmpresa || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8;">E-mail</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; font-weight: 600;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #94a3b8;">Plano</td>
                <td style="padding: 12px 0; font-weight: 600;">Trial Premium (14 dias)</td>
              </tr>
            </table>
            <a href="https://app.zynplan.com.br/login"
               style="display: inline-block; background: #d4a843; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700;">
              Acessar minha conta →
            </a>
            <p style="color: #475569; font-size: 13px; margin-top: 32px;">Qualquer dúvida, fale com a gente em <a href="https://zyncompany.com.br/contato" style="color: #d4a843;">zyncompany.com.br/contato</a>.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Erro ao enviar boas-vindas:', emailErr)
    }

    // 6. Notificação interna
    try {
      await resend.emails.send({
        from: 'Zynplan <noreply@zyncompany.com.br>',
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
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Erro ao enviar notificação:', emailErr)
    }

    return NextResponse.json({
      success: true,
      accessToken: (sessionData?.properties as any)?.access_token || null,
      refreshToken: (sessionData?.properties as any)?.refresh_token || null,
    })

  } catch (err) {
    console.error('Erro cadastro:', err)
    return NextResponse.json({ error: 'Erro inesperado. Tente novamente.' }, { status: 500 })
  }
}