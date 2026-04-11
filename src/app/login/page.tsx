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
 
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha email e senha')
      return
    }
 
    setErro('')
    setLoading(true)
 
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })
 
      if (error || !data.user) {
        setErro('Email ou senha inválidos')
        return
      }
 
      // Redireciona imediatamente — useEmpresa no layout busca os dados via RPC
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
          <h1 style={logoTitulo}>🏗️ DudaBuild</h1>
          <p style={logoSub}>Acesse sua conta</p>
        </div>
 
        <form onSubmit={entrar}>
 
          <label style={label}>Email</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={input}
          />
 
          <label style={label}>Senha</label>
          <div style={{ position: 'relative', marginBottom: 0 }}>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              style={{ ...input, paddingRight: 40 }}
            />
            <span
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={olho}
              title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
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
          <span onClick={() => router.push('/cadastro')} style={link}>
            Criar agora
          </span>
        </p>
 
      </div>
    </div>
  )
}
 
const container: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', justifyContent: 'center',
  alignItems: 'center', background: '#0f172a', padding: 20,
}
const card: React.CSSProperties = {
  background: '#1e293b', padding: 36, borderRadius: 16,
  width: '100%', maxWidth: 400, color: '#fff',
  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
}
const logoArea: React.CSSProperties = { textAlign: 'center', marginBottom: 28 }
const logoTitulo: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#fff' }
const logoSub: React.CSSProperties = { fontSize: 13, color: '#94a3b8', marginTop: 4 }
const label: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#94a3b8', marginBottom: 4, marginTop: 16,
}
const input: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #334155', background: '#0f172a',
  color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box',
}
const olho: React.CSSProperties = {
  position: 'absolute', right: 10, top: '50%',
  transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 16,
}
const erroStyle: React.CSSProperties = {
  color: '#f87171', fontSize: 13, marginTop: 10,
  background: '#450a0a', padding: '8px 12px', borderRadius: 6,
}
const botao: React.CSSProperties = {
  width: '100%', padding: 13, marginTop: 22, background: '#22c55e',
  color: '#fff', border: 'none', borderRadius: 8, fontSize: 15,
  fontWeight: 700, cursor: 'pointer',
}
const linkCadastro: React.CSSProperties = {
  textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b',
}
const link: React.CSSProperties        = { color: '#38bdf8', cursor: 'pointer' }
const linkEsqueci: React.CSSProperties = { color: '#64748b', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }