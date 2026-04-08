'use client'

import { supabase } from '@/lib/supabase'

export default function Planos() {

  async function assinar(priceId: string) {

    const session = await supabase.auth.getSession()

    const token = session.data.session?.access_token

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ priceId })
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Erro ao iniciar pagamento')
    }
  }

  return (
    <div style={container}>

      <h1 style={titulo}>💰 Escolha seu plano</h1>

      <div style={grid}>

        {/* BASICO */}
        <div style={card}>
          <h2>Básico</h2>
          <p>R$ 49,90</p>
          <ul>
            <li>2 obras</li>
            <li>5 orçamentos</li>
          </ul>
        </div>

        {/* PRO */}
        <div style={cardDestaque}>
          <h2>PRO 🚀</h2>
          <p>R$ 99,90/mês</p>
          <ul>
            <li>5 obras</li>
            <li>10 orçamentos</li>
          </ul>

          <button
            style={botao}
            onClick={() => assinar('price_1TJg8HFjaswz9WcmLtUD1Wzk')} // 🔥 SEU PRICE ID
          >
            Assinar
          </button>
        </div>

        {/* PREMIUM */}
        <div style={card}>
          <h2>Premium 👑</h2>
          <p>R$ 159,90/mês</p>
          <ul>
            <li>Obras ilimitadas</li>
            <li>Orçamentos ilimitados</li>
          </ul>

          <button
            style={botao}
            onClick={() => assinar('price_1TJg99Fjaswz9WcmOhX7PsvZ')} // 🔥 OUTRO PRICE
          >
            Assinar
          </button>
        </div>

      </div>

    </div>
  )
}

/* ESTILO */

const container = {
  padding: 40,
  textAlign: 'center' as const
}

const titulo = {
  fontSize: 28,
  marginBottom: 30
}

const grid = {
  display: 'flex',
  gap: 20,
  justifyContent: 'center',
  flexWrap: 'wrap' as const
}

const card = {
  border: '1px solid #ddd',
  padding: 20,
  borderRadius: 12,
  width: 250
}

const cardDestaque = {
  ...card,
  border: '2px solid #2563eb'
}

const botao = {
  marginTop: 15,
  padding: '10px 15px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer'
}