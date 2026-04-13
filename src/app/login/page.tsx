'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()

  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro,         setErro]         = useState('')
  const [loading,      setLoading]      = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !senha.trim()) { setErro('Preencha email e senha'); return }
    setErro('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error || !data.user) { setErro('Email ou senha inválidos'); return }
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={container}>
      <div style={card}>
        <div style={logoArea}>
          <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan" style={{ width: 280, display: 'block', margin: '0 auto 4px' }} />
          <p style={logoSub}>Acesse sua conta</p>
        </div>

        <form onSubmit={entrar}>
          <label style={label}>Email</label>
          <input type="email" placeholder="seu@email.com" value={email}
            onChange={e => setEmail(e.target.value)} required style={input} />

          <label style={label}>Senha</label>
          <div style={{ position: 'relative', marginBottom: 0 }}>
            <input type={mostrarSenha ? 'text' : 'password'} placeholder="••••••••"
              value={senha} onChange={e => setSenha(e.target.value)} required
              style={{ ...input, paddingRight: 40 }} />
            <span onClick={() => setMostrarSenha(!mostrarSenha)} style={olho}>
              {mostrarSenha ? '🙈' : '👁'}
            </span>
          </div>

          <div style={{ textAlign: 'right', marginTop: 6 }}>
            <span onClick={() => router.push('/recuperar-senha')} style={linkEsqueci}>
              Esqueci minha senha
            </span>
          </div>

          {erro && <p style={erroStyle}>{erro}</p>}

          <button type="submit" style={botao} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={linkCadastro}>
          Não tem conta?{' '}
          <span onClick={() => router.push('/cadastro')} style={link}>Criar agora</span>
        </p>
      </div>
    </div>
  )
}

const container: React.CSSProperties    = { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000000', padding: 20 }
const card: React.CSSProperties         = { background: '#0a0a0a', padding: '32px 36px', borderRadius: 16, width: '100%', maxWidth: 400, color: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid #1a1a1a' }
const logoArea: React.CSSProperties     = { textAlign: 'center', marginBottom: 28 }
const logoSub: React.CSSProperties      = { fontSize: 13, color: '#64748b', marginTop: 8 }
const label: React.CSSProperties        = { display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4, marginTop: 16 }
const input: React.CSSProperties        = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1e293b', background: '#111111', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }
const olho: React.CSSProperties         = { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 16 }
const erroStyle: React.CSSProperties    = { color: '#f87171', fontSize: 13, marginTop: 10, background: '#450a0a', padding: '8px 12px', borderRadius: 6 }
const botao: React.CSSProperties        = { width: '100%', padding: 13, marginTop: 22, background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const linkCadastro: React.CSSProperties = { textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }
const link: React.CSSProperties         = { color: '#d4a843', cursor: 'pointer' }
const linkEsqueci: React.CSSProperties  = { color: '#64748b', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }