'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function entrar(e: any) {
    e.preventDefault()

    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .single()

    if (!data) {
      alert('Login inválido')
      return
    }

    localStorage.setItem('empresa_id', data.empresa_id)
    router.push('/')
  }

  return (
    <div style={container}>
      <div style={card}>
        <h1 style={titulo}>DudaBuild</h1>
        <p style={subtitulo}>Acesse sua plataforma</p>

        <form onSubmit={entrar}>
          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <input
            placeholder="Senha"
            type="password"
            onChange={(e) => setSenha(e.target.value)}
            style={input}
          />

          <button style={botao}>Entrar</button>
        </form>
      </div>
    </div>
  )
}

/* 🎨 ESTILO PROFISSIONAL */

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
  width: '320px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
  textAlign: 'center' as const,
}

const titulo = {
  marginBottom: '5px',
  color: '#0f172a',
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
}