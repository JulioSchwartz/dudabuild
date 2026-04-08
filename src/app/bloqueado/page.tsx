'use client'

import { useRouter } from 'next/navigation'

export default function Bloqueado() {
  const router = useRouter()

  return (
    <div style={container}>
      <div style={card}>
        <h1>🚫 Acesso bloqueado</h1>
        <p>Seu plano está inativo ou pagamento pendente.</p>

        <button onClick={() => router.push('/planos')} style={botao}>
          Regularizar pagamento
        </button>
      </div>
    </div>
  )
}

const container = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#0f172a'
}

const card = {
  background: '#fff',
  padding: 30,
  borderRadius: 12,
  textAlign: 'center' as const
}

const botao = {
  marginTop: 20,
  padding: 12,
  background: '#2563eb',
  color: '#fff',
  borderRadius: 8
}