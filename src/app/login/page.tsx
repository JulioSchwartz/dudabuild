'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function entrar(e: any) {
    e.preventDefault()

    setErro('')
    setLoading(true)

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .single()

    if (error || !data) {
      setErro('Email ou senha inválidos')
      setLoading(false)
      return
    }

    // salva empresa
    localStorage.setItem('empresa_id', data.empresa_id)

    // 🔥 REDIRECIONA PRA CAPA (NOVO FLUXO)
    router.push('/')
  }

  return (
    <div style={container}>
      <div style={card}>
        <h1 style={titulo}>🏗️ DudaBuild</h1>
        <p style={subtitulo}>Acesse sua conta</p>

        <form onSubmit={entrar}>
          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <div style={senhaBox}>
            <input
              placeholder="Senha"
              type={mostrarSenha ? 'text' : 'password'}
              onChange={(e) => setSenha(e.target.value)}
              style={{ ...input, marginBottom: 0 }}
            />

            <span
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={toggleSenha}
            >
              {mostrarSenha ? '🙈' : '👁'}
            </span>
          </div>

          {erro && <p style={erroStyle}>{erro}</p>}

          <button style={botao} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* 🎨 ESTILO PREMIUM */

const container = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #1e293b, #0f172a)',
}

const card = {
  background: '#ffffff',
  padding: '40px',
  borderRadius: '16px',
  width: '340px',
  boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
  textAlign: 'center' as const,
}

const titulo = {
  marginBottom: '5px',
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '700',
}

const subtitulo = {
  marginBottom: '20px',
  color: '#64748b',
  fontSize: '14px',
}

const input = {
  display: 'block',
  width: '100%',
  marginBottom: '12px',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  outline: 'none',
  transition: '0.2s',
}

const senhaBox = {
  position: 'relative' as const,
  marginBottom: '12px',
}

const toggleSenha = {
  position: 'absolute' as const,
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  cursor: 'pointer',
}

const erroStyle = {
  color: '#ef4444',
  fontSize: '13px',
  marginBottom: '10px',
}

const botao = {
  width: '100%',
  background: '#2563eb',
  color: '#fff',
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: '0.2s',
}