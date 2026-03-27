'use client'

import { useRouter } from 'next/navigation'

export default function Pagar() {
  const router = useRouter()

  function escolherPlano(plano: string) {
    // por enquanto vamos simular
    alert(`Plano escolhido: ${plano}`)

    // depois vamos conectar com Stripe aqui
  }

  return (
    <div style={container}>
      <h1 style={titulo}>Escolha seu plano</h1>

      <div style={grid}>
        {/* PLANO BÁSICO */}
        <div style={card}>
          <h2>Básico</h2>
          <p style={preco}>R$49,90/mês</p>

          <ul style={lista}>
            <li>✔ Até 3 obras</li>
            <li>✔ Controle financeiro</li>
            <li>✔ Dashboard simples</li>
          </ul>

          <button
            style={btnBasico}
            onClick={() => escolherPlano('basico')}
          >
            Assinar Básico
          </button>
        </div>

        {/* PLANO PRO */}
        <div style={cardDestaque}>
          <h2>Pro</h2>
          <p style={preco}>R$99,90/mês</p>

          <ul style={lista}>
            <li>✔ Obras ilimitadas</li>
            <li>✔ Métricas avançadas</li>
            <li>✔ Fluxo de caixa</li>
            <li>✔ Relatórios completos</li>
          </ul>

          <button
            style={btnPro}
            onClick={() => escolherPlano('pro')}
          >
            Assinar Pro
          </button>
        </div>
      </div>

      <button style={voltar} onClick={() => router.push('/')}>
        ← Voltar
      </button>
    </div>
  )
}

/* =========================
   🎨 ESTILO
========================= */

const container = {
  padding: '40px',
  textAlign: 'center' as const,
}

const titulo = {
  fontSize: '28px',
  marginBottom: '30px',
}

const grid = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  flexWrap: 'wrap' as const,
}

const card = {
  background: '#fff',
  padding: '25px',
  borderRadius: '12px',
  width: '280px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
}

const cardDestaque = {
  ...card,
  border: '2px solid #2563eb',
}

const preco = {
  fontSize: '22px',
  margin: '15px 0',
  fontWeight: 'bold',
}

const lista = {
  textAlign: 'left' as const,
  marginBottom: '20px',
}

const btnBasico = {
  background: '#64748b',
  color: '#fff',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  cursor: 'pointer',
  width: '100%',
}

const btnPro = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  cursor: 'pointer',
  width: '100%',
}

const voltar = {
  marginTop: '30px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#2563eb',
}