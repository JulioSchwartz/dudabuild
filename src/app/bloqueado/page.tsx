'use client'

import { useRouter } from 'next/navigation'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function Bloqueado() {
  const router = useRouter()
  const { trialExpirado } = useEmpresa()

  return (
    <div style={container}>
      <div style={card}>

        <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan"
          style={{ width: 180, display: 'block', margin: '0 auto 24px', mixBlendMode: 'screen' }} />

        {trialExpirado ? (
          <>
            <div style={icone}>⏰</div>
            <h1 style={titulo}>Seu período de trial encerrou</h1>
            <p style={descricao}>
              Seus 14 dias de acesso gratuito ao plano Premium chegaram ao fim.
              Escolha um plano para continuar usando o <strong style={{ color: '#d4a843' }}>Zynplan</strong> e não perder seus dados.
            </p>
          </>
        ) : (
          <>
            <div style={icone}>🔒</div>
            <h1 style={titulo}>Acesso suspenso</h1>
            <p style={descricao}>
              Seu plano está inativo ou com pagamento pendente. Regularize para voltar a usar o Zynplan.
            </p>
          </>
        )}

        <div style={beneficios}>
          <p style={benefTitulo}>O que você ganha ao assinar:</p>
          {[
            '✅ Obras e orçamentos conforme seu plano',
            '✅ Todos os seus dados preservados',
            '✅ Diário de obra, contratos e cronogramas',
            '✅ Relatórios financeiros completos',
            '✅ Suporte dedicado',
          ].map((b, i) => (
            <p key={i} style={benefItem}>{b}</p>
          ))}
        </div>

        <button onClick={() => router.push('/planos')} style={btnAssinar}>
          ⚡ Ver planos e assinar agora
        </button>

        <p style={rodape}>Dúvidas? Entre em contato pelo WhatsApp ou email.</p>
      </div>
    </div>
  )
}

const container: React.CSSProperties  = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 24 }
const card: React.CSSProperties       = { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 20, padding: '40px 36px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }
const icone: React.CSSProperties      = { fontSize: 48, marginBottom: 16 }
const titulo: React.CSSProperties     = { fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }
const descricao: React.CSSProperties  = { fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 24 }
const beneficios: React.CSSProperties = { background: '#111', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }
const benefTitulo: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#d4a843', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }
const benefItem: React.CSSProperties  = { fontSize: 13, color: '#94a3b8', marginBottom: 6 }
const btnAssinar: React.CSSProperties = { width: '100%', padding: '14px 0', background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 16 }
const rodape: React.CSSProperties     = { fontSize: 12, color: '#334155' }