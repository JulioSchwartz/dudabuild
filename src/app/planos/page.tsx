'use client'

import { useState } from 'react'

export default function Planos() {
  const [loading, setLoading] = useState<string | null>(null)

  async function assinar(priceId: string) {
    try {
      setLoading(priceId)

      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()

      if (!data.url) {
        alert('Erro ao iniciar pagamento')
        return
      }

      window.location.href = data.url
    } catch (err) {
      console.error(err)
      alert('Erro ao conectar com pagamento')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ textAlign: 'center' }}>Escolha seu plano</h1>

      <div style={{ display: 'flex', gap: 20, marginTop: 30, justifyContent: 'center' }}>

        {/* BASICO */}
        <div style={card}>
          <h2>Básico</h2>
          <p style={preco}>R$ 49,90/mês</p>

          <ul style={lista}>
            <li>✔ Até 2 obras</li>
            <li>✔ Até 5 orçamentos</li>
          </ul>

          <button
            onClick={() => assinar('price_1TJg7cFjaswz9WcmjuSi3KLQ')}
            style={botao}
            disabled={loading !== null}
          >
            {loading === 'price_1TJg7cFjaswz9WcmjuSi3KLQ'
              ? 'Carregando...'
              : 'Assinar Básico'}
          </button>
        </div>

        {/* PRO (DESTAQUE) */}
        <div style={cardDestaque}>
          <h2>PRO 🚀</h2>
          <p style={preco}>R$ 99,90/mês</p>

          <ul style={lista}>
            <li>✔ Até 5 obras</li>
            <li>✔ Até 10 orçamentos</li>
          </ul>

          <button
            onClick={() => assinar('price_1TJg8HFjaswz9WcmLtUD1Wzk')}
            style={botao}
            disabled={loading !== null}
          >
            {loading === 'price_1TJg8HFjaswz9WcmLtUD1Wzk'
              ? 'Carregando...'
              : 'Assinar Pro'}
          </button>
        </div>

        {/* PREMIUM */}
        <div style={card}>
          <h2>Premium 💎</h2>
          <p style={preco}>R$ 159,90/mês</p>

          <ul style={lista}>
            <li>✔ Obras ilimitadas</li>
            <li>✔ Orçamentos ilimitados</li>
          </ul>

          <button
            onClick={() => assinar('price_1TJg99Fjaswz9WcmOhX7PsvZ')}
            style={botao}
            disabled={loading !== null}
          >
            {loading === 'price_1TJg99Fjaswz9WcmOhX7PsvZ'
              ? 'Carregando...'
              : 'Assinar Premium'}
          </button>
        </div>

      </div>
    </div>
  )
}

/* 🎨 ESTILO */

const card = {
  border: '1px solid #e2e8f0',
  padding: 20,
  borderRadius: 12,
  width: 240,
  textAlign: 'center' as const,
}

const cardDestaque = {
  ...card,
  border: '2px solid #2563eb',
  transform: 'scale(1.05)',
}

const preco = {
  fontSize: 20,
  fontWeight: 'bold',
  margin: '10px 0',
}

const lista = {
  textAlign: 'left' as const,
  fontSize: 14,
  marginBottom: 10,
}

const botao = {
  marginTop: 10,
  padding: 12,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  width: '100%',
  fontWeight: 'bold',
}