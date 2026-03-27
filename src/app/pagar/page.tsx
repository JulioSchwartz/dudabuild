'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Assinatura() {
  const router = useRouter()
  const [empresa, setEmpresa] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const empresa_id = localStorage.getItem('empresa_id')

    if (!empresa_id) {
      router.push('/login')
    } else {
      setEmpresa(empresa_id)
    }
  }, [])

  async function ativarPlano(plano: string) {
    if (!empresa) return

    setLoading(true)

    await supabase.from('assinaturas').insert([
      {
        empresa_id: empresa,
        status: 'ativa',
        plano,
      },
    ])

    alert('Plano ativado com sucesso!')
    router.push('/dashboard')
  }

  return (
    <div style={container}>
      {/* HEADER */}
      <div style={header}>
        <h1 style={titulo}>Escolha seu plano</h1>
        <p style={subtitulo}>
          Comece a controlar suas obras com inteligência
        </p>
      </div>

      {/* PLANOS */}
      <div style={grid}>
        {/* BÁSICO */}
        <div style={card}>
          <h2 style={planoNome}>Básico</h2>
          <p style={preco}>R$ 49<span style={mes}>/mês</span></p>

          <ul style={lista}>
            <li>✔ Gestão de obras</li>
            <li>✔ Financeiro básico</li>
            <li>✔ Dashboard geral</li>
          </ul>

          <button
            style={botaoSecundario}
            onClick={() => ativarPlano('basico')}
            disabled={loading}
          >
            Começar agora
          </button>
        </div>

        {/* PRO (DESTAQUE) */}
        <div style={cardDestaque}>
          <div style={badge}>MAIS ESCOLHIDO</div>

          <h2 style={planoNome}>Pro</h2>
          <p style={precoDestaque}>R$ 99<span style={mes}>/mês</span></p>

          <ul style={lista}>
            <li>✔ Tudo do básico</li>
            <li>✔ Indicadores avançados</li>
            <li>✔ ROI, margem e custos automáticos</li>
            <li>✔ Relatórios por obra</li>
          </ul>

          <button
            style={botaoPrincipal}
            onClick={() => ativarPlano('pro')}
            disabled={loading}
          >
            Assinar agora 🚀
          </button>
        </div>
      </div>
    </div>
  )
}

/* 🎨 ESTILO PROFISSIONAL (CONVERSÃO) */

const container = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
  padding: '40px 20px',
  color: '#fff',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '40px',
}

const titulo = {
  fontSize: '32px',
  marginBottom: '10px',
}

const subtitulo = {
  color: '#cbd5f5',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '30px',
  maxWidth: '900px',
  margin: '0 auto',
}

const card = {
  background: '#ffffff',
  color: '#0f172a',
  padding: '30px',
  borderRadius: '16px',
  textAlign: 'center' as const,
}

const cardDestaque = {
  ...card,
  border: '2px solid #22c55e',
  transform: 'scale(1.05)',
  position: 'relative' as const,
}

const badge = {
  position: 'absolute' as const,
  top: '-12px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#22c55e',
  color: '#fff',
  padding: '5px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
}

const planoNome = {
  fontSize: '22px',
  marginBottom: '10px',
}

const preco = {
  fontSize: '28px',
  marginBottom: '20px',
}

const precoDestaque = {
  ...preco,
  color: '#22c55e',
  fontWeight: 'bold',
}

const mes = {
  fontSize: '14px',
  marginLeft: '5px',
}

const lista = {
  textAlign: 'left' as const,
  marginBottom: '25px',
  lineHeight: '1.8',
}

const botaoPrincipal = {
  background: '#22c55e',
  color: '#fff',
  padding: '12px',
  width: '100%',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  cursor: 'pointer',
}

const botaoSecundario = {
  background: '#2563eb',
  color: '#fff',
  padding: '12px',
  width: '100%',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
}