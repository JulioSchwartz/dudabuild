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

    // 🔥 LOGIN REAL
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('Email ou senha inválidos')
      setLoading(false)
      return
    }

    const user = data.user

    // 🔥 BUSCA EMPRESA DO USUÁRIO
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single()

    if (!usuario?.empresa_id) {
      setErro('Usuário sem empresa vinculada')
      setLoading(false)
      return
    }

    // 🔥 SALVA (temporário - depois removemos)
    localStorage.setItem('empresa_id', usuario.empresa_id)

    router.push('/dashboard')
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

	  <p style={linkCadastro}>
	    Não tem conta?{' '}
	    <span onClick={() => router.push('/cadastro')} style={link}>
	      Criar agora
	    </span>
	  </p>
        </form>
      </div>
    </div>
  )
}

/* 🎨 ESTILO */

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
}

const linkCadastro = {
  marginTop: '15px',
  fontSize: '13px',
  color: '#64748b',
}

const link = {
  color: '#2563eb',
  fontWeight: 'bold',
  cursor: 'pointer',
}