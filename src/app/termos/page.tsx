'use client'

import { useRouter } from 'next/navigation'

export default function Termos() {
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
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, marginBottom: 8 }}>Termos de Serviço</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 48 }}>Última atualização: 15 de abril de 2026</p>

        {[
          {
            titulo: '1. Aceitação dos Termos',
            texto: 'Ao criar uma conta ou utilizar os serviços da Zynplan, você concorda com estes Termos de Serviço e com nossa Política de Privacidade. Se você não concordar com estes termos, não utilize nossos serviços. Estes termos constituem um contrato legal entre você (ou a empresa que representa) e a Zynplan.',
          },
          {
            titulo: '2. Descrição do Serviço',
            texto: 'A Zynplan é uma plataforma SaaS (Software como Serviço) de gestão para construção civil brasileira. Oferecemos ferramentas para gestão de obras, controle financeiro, orçamentos com SINAPI integrado, diário de obra, cronograma físico, contrato digital e multi-usuário. Os serviços são prestados via internet mediante assinatura mensal.',
          },
          {
            titulo: '3. Cadastro e Conta',
            texto: 'Para utilizar a plataforma, você deve criar uma conta fornecendo informações verdadeiras e completas. Você é responsável pela segurança da sua senha e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado. A Zynplan reserva o direito de encerrar contas que violem estes termos.',
          },
          {
            titulo: '4. Planos e Pagamentos',
            texto: 'Oferecemos três planos de assinatura: Básico (R$ 79,90/mês), Pro (R$ 149,90/mês) e Premium (R$ 299,90/mês). Novos usuários têm acesso a 14 dias de trial gratuito no plano Premium, sem necessidade de cartão de crédito. Após o trial, é necessário assinar um plano para continuar. Os pagamentos são processados mensalmente via Stripe e podem ser cancelados a qualquer momento.',
          },
          {
            titulo: '5. Cancelamento e Reembolso',
            texto: 'Você pode cancelar sua assinatura a qualquer momento, sem multa ou fidelidade. O cancelamento entra em vigor ao final do período já pago. Oferecemos garantia de 7 dias: se não estiver satisfeito após a primeira cobrança, reembolsamos integralmente mediante solicitação por e-mail em até 7 dias após o pagamento.',
          },
          {
            titulo: '6. Propriedade dos Dados',
            texto: 'Todos os dados inseridos na plataforma (obras, orçamentos, lançamentos financeiros, fotos, contratos) pertencem exclusivamente a você. A Zynplan não reivindica propriedade sobre seus dados. Após o cancelamento, seus dados ficam disponíveis para exportação por 30 dias.',
          },
          {
            titulo: '7. Uso Aceitável',
            texto: 'Você concorda em utilizar a plataforma apenas para fins legais e de acordo com estes termos. É proibido: utilizar a plataforma para fins fraudulentos, tentar acessar dados de outros usuários, realizar engenharia reversa do software, e violar leis ou regulamentações aplicáveis.',
          },
          {
            titulo: '8. Disponibilidade do Serviço',
            texto: 'A Zynplan se esforça para manter a plataforma disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta. Podemos realizar manutenções programadas com aviso prévio. Não nos responsabilizamos por interrupções causadas por fatores externos como falhas de internet ou força maior.',
          },
          {
            titulo: '9. Limitação de Responsabilidade',
            texto: 'A Zynplan não se responsabiliza por danos indiretos, incidentais ou consequentes decorrentes do uso ou incapacidade de uso dos serviços. Nossa responsabilidade total está limitada ao valor pago pelo usuário nos últimos 3 meses de assinatura.',
          },
          {
            titulo: '10. Modificações nos Termos',
            texto: 'Podemos modificar estes termos a qualquer momento. Notificaremos você sobre alterações significativas por e-mail com antecedência mínima de 15 dias. O uso continuado dos serviços após as modificações constitui aceitação dos novos termos.',
          },
          {
            titulo: '11. Lei Aplicável e Foro',
            texto: 'Estes termos são regidos pela legislação brasileira. Para resolução de conflitos, fica eleito o foro da comarca de Videira, Santa Catarina, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
          },
          {
            titulo: '12. Contato',
            texto: 'Para dúvidas sobre estes termos, entre em contato: E-mail: suportezynplan@gmail.com | WhatsApp: (49) 9 9158-7646 | Site: app.zynplan.com.br',
          },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{s.titulo}</h2>
            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8 }}>{s.texto}</p>
          </div>
        ))}

        <div style={{ marginTop: 64, padding: '24px 28px', background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 12 }}>
          <p style={{ fontSize: 14, color: '#d4a843', fontWeight: 600, marginBottom: 8 }}>Zynplan — Planejamento Inteligente</p>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Julio Cesar Schwartz · suportezynplan@gmail.com · (49) 9 9158-7646 · Videira, SC</p>
        </div>
      </div>

      {/* RODAPÉ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 5%', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#334155' }}>© 2026 Zynplan · Todos os direitos reservados</p>
      </footer>
    </div>
  )
}