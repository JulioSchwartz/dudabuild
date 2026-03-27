'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Assinatura() {
  const router = useRouter()
  const [empresa, setEmpresa] = useState<string | null>(null)

  useEffect(() => {
    const empresa_id = localStorage.getItem('empresa_id')

    if (!empresa_id) {
      router.push('/login')
    } else {
      setEmpresa(empresa_id)
    }
  }, [])

  async function ativarPlano() {
    if (!empresa) return

    await supabase.from('assinaturas').insert([
      {
        empresa_id: empresa,
        status: 'ativa',
      },
    ])

    alert('Plano ativado com sucesso!')
    router.push('/dashboard')
  }

  return (
    <div style={container}>
      <h1 style={titulo}>Escolha seu plano</h1>

      <div style={grid}>
        <div style={card}>
          <h2>Plano Básico</h2>
          <p style={preco}>R$ 49/mês</p>

          <ul style={lista}>
            <li>✔ Controle de obras</li>
            <li>✔ Financeiro</li>
            <li>✔ Dashboard</li>
          </ul>

          <button style={botao} onClick={ativarPlano}>
            Assinar
          </button>
        </div>

        <div style={cardDestaque}>
          <h2>Plano Pro</h2>
          <p style={preco}>R$ 99/mês</p>

          <ul style={lista}>
            <li>✔ Tudo do básico</li>
            <li>✔ Indicadores avançados</li>
            <li>✔ Relatórios</li>
          </ul>

          <button style={botao} onClick={ativarPlano}>
            Assinar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ESTILO */

const container = { padding: '20px' }
const titulo = { marginBottom: '20px' }

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
}

const card = {
  background: '#fff',
  padding: '20px',
  borderRadius: '12px',
}

const cardDestaque = {
  ...card,
  border: '2px solid #2563eb',
}

const preco = {
  fontSize: '24px',
  margin: '10px 0',
}

const lista = {
  marginBottom: '20px',
}

const botao = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
}