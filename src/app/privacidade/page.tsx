'use client'

import { useRouter } from 'next/navigation'

export default function Privacidade() {
  const router = useRouter()

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#0a0a0f', color: '#fff', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');* { margin: 0; padding: 0; box-sizing: border-box; }`}</style>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 5%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan" style={{ height: 32, mixBlendMode: 'screen', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <button onClick={() => router.push('/')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', padding: '7px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            ← Voltar
          </button>
        </div>
      </nav>

      {/* CONTEÚDO */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 5% 100px' }}>
        <p style={{ fontSize: 13, color: '#d4a843', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Legal</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, marginBottom: 8 }}>Política de Privacidade</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 48 }}>Última atualização: 15 de abril de 2026</p>

        {[
          {
            titulo: '1. Quem somos',
            texto: 'A Zynplan é uma plataforma SaaS de gestão para construção civil brasileira, desenvolvida e operada por Julio Cesar Schwartz. Nosso site é app.zynplan.com.br e nosso contato é suportezynplan@gmail.com.',
          },
          {
            titulo: '2. Quais dados coletamos',
            texto: 'Coletamos os seguintes dados pessoais: nome completo, endereço de e-mail, número de telefone/WhatsApp, CNPJ e dados da empresa, dados de pagamento (processados pelo Stripe — não armazenamos dados de cartão), dados de uso da plataforma (obras, orçamentos, lançamentos financeiros, fotos de obra), e dados técnicos como endereço IP, tipo de navegador e logs de acesso.',
          },
          {
            titulo: '3. Por que coletamos esses dados',
            texto: 'Utilizamos seus dados para: prestação dos serviços contratados, processamento de pagamentos e controle de assinaturas, envio de comunicações importantes sobre sua conta, melhoria contínua da plataforma, suporte ao cliente, e cumprimento de obrigações legais.',
          },
          {
            titulo: '4. Base legal para o tratamento',
            texto: 'O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais previstas na Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018): execução de contrato, quando necessário para a prestação dos serviços; consentimento, para comunicações de marketing; legítimo interesse, para melhoria dos serviços e segurança; e cumprimento de obrigação legal.',
          },
          {
            titulo: '5. Com quem compartilhamos seus dados',
            texto: 'Seus dados podem ser compartilhados com: Supabase (banco de dados e autenticação), Stripe (processamento de pagamentos), Resend (envio de e-mails transacionais) e Vercel (hospedagem da aplicação). Todos os fornecedores são selecionados criteriosamente e operam sob políticas de privacidade compatíveis com a LGPD. Não vendemos seus dados a terceiros.',
          },
          {
            titulo: '6. Por quanto tempo mantemos seus dados',
            texto: 'Mantemos seus dados pelo período necessário para a prestação dos serviços contratados. Após o cancelamento da conta, seus dados ficam disponíveis para exportação por 30 dias e são excluídos permanentemente após esse prazo, salvo obrigação legal de retenção.',
          },
          {
            titulo: '7. Seus direitos',
            texto: 'De acordo com a LGPD, você tem os seguintes direitos: acesso aos seus dados pessoais, correção de dados incompletos ou desatualizados, eliminação dos dados pessoais, portabilidade dos dados, revogação do consentimento, e oposição ao tratamento. Para exercer qualquer um desses direitos, entre em contato pelo e-mail suportezynplan@gmail.com.',
          },
          {
            titulo: '8. Segurança dos dados',
            texto: 'Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou destruição. Utilizamos criptografia em trânsito (HTTPS/TLS) e em repouso, controle de acesso por autenticação, backups automáticos e monitoramento contínuo de segurança.',
          },
          {
            titulo: '9. Cookies',
            texto: 'Utilizamos cookies essenciais para o funcionamento da plataforma, incluindo cookies de sessão para autenticação. Não utilizamos cookies de rastreamento ou publicidade de terceiros.',
          },
          {
            titulo: '10. Alterações nesta política',
            texto: 'Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações significativas por e-mail ou por aviso na plataforma. O uso continuado dos serviços após as alterações constitui aceitação da nova política.',
          },
          {
            titulo: '11. Contato',
            texto: 'Para dúvidas sobre esta política ou sobre o tratamento dos seus dados pessoais, entre em contato: E-mail: suportezynplan@gmail.com | WhatsApp: (49) 9 9158-7646 | Site: app.zynplan.com.br',
          },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{s.titulo}</h2>
            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8 }}>{s.texto}</p>
          </div>
        ))}

        <div style={{ marginTop: 64, padding: '24px 28px', background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 12 }}>
          <p style={{ fontSize: 14, color: '#d4a843', fontWeight: 600, marginBottom: 8 }}>Encarregado de Proteção de Dados (DPO)</p>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Julio Cesar Schwartz · suportezynplan@gmail.com · (49) 9 9158-7646</p>
        </div>
      </div>

      {/* RODAPÉ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 5%', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#334155' }}>© 2026 Zynplan · Todos os direitos reservados</p>
      </footer>
    </div>
  )
}