import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!)

    const { nome, email, tel } = await req.json()

    if (!nome || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
    }

    const numeroLead = (tel || '').replace(/\D/g, '')
    const msgWhatsApp = `Olá, ${nome}! Meu nome é Julio Cesar Schwartz, fundador da Zynplan. Identifiquei seu interesse em nossa plataforma de gestão para construção civil e gostaria de apresentar como podemos transformar a gestão das suas obras — do orçamento à entrega. Teria disponibilidade para uma conversa rápida esta semana?`

    await resend.emails.send({
      from: 'Zynplan <noreply@zynplan.com.br>',
      to: ['suportezynplan@gmail.com'],
      subject: `Novo lead: ${nome}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #fff; border-radius: 12px;">
          <h2 style="color: #d4a843; margin-bottom: 24px;">Novo lead pela landing page 🎯</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; width: 120px;">Nome</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; font-weight: 600;">${nome}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8;">E-mail</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; font-weight: 600;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #94a3b8;">WhatsApp</td>
              <td style="padding: 12px 0; font-weight: 600;">${tel || 'Não informado'}</td>
            </tr>
          </table>
          ${numeroLead ? `
          <a href="https://wa.me/55${numeroLead}?text=${encodeURIComponent(msgWhatsApp)}"
             style="display: inline-block; margin-top: 24px; background: #25d366; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700;">
            💬 Responder no WhatsApp
          </a>
          ` : ''}
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 })
  }
}