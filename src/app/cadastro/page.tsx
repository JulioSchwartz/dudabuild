'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Cadastro() {
  const router = useRouter()

  const [nomeEmpresa,  setNomeEmpresa]  = useState('')
  const [nomeUsuario,  setNomeUsuario]  = useState('')
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [etapa,        setEtapa]        = useState<'formulario' | 'sucesso'>('formulario')
  const [erro,         setErro]         = useState('')

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!email.trim() || !senha.trim()) { setErro('Preencha todos os campos obrigatórios'); return }
    if (senha.length < 6)               { setErro('A senha deve ter no mínimo 6 caracteres'); return }
    if (senha !== confirmSenha)         { setErro('As senhas não coincidem'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:       email.trim(),
          password:    senha,
          nomeEmpresa: nomeEmpresa.trim() || nomeUsuario.trim() || email,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || 'Erro ao criar conta. Tente novamente.')
        setLoading(false)
        return
      }

      // Login automático via tokens retornados pelo backend
      if (data.accessToken && data.refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        })
        if (sessionError) {
          // Fallback: tenta signInWithPassword
          await new Promise(resolve => setTimeout(resolve, 800))
          const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha })
          if (loginError) {
            setErro('Conta criada com sucesso! Houve um erro ao entrar automaticamente. Clique em "Fazer login" e acesse com o e-mail e senha que você acabou de cadastrar.')
            setLoading(false)
            return
          }
        }
      } else {
        // Fallback: tenta signInWithPassword
        await new Promise(resolve => setTimeout(resolve, 800))
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (loginError) {
          setErro('Conta criada com sucesso! Houve um erro ao entrar automaticamente. Clique em "Fazer login" e acesse com o e-mail e senha que você acabou de cadastrar.')
          setLoading(false)
          return
        }
      }

      // Mostra tela de sucesso e redireciona após 2.5s
      setEtapa('sucesso')
      setTimeout(() => router.push('/dashboard'), 2500)

    } catch (err) {
      console.error(err)
      setErro('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  if (etapa === 'sucesso') {
    return (
      <div style={container}>
        <div style={{ ...card, textAlign: 'center' as const }}>
          <div style={logoArea}>
            <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan"
              style={{ width: 180, display: 'block', margin: '0 auto', mixBlendMode: 'screen' as const }} />
          </div>

          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(212,168,67,0.15)', border: '2px solid rgba(212,168,67,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 36
          }}>✅</div>

          <h2 style={{ color: '#fff', fontWeight: 800, margin: '0 0 8px', fontSize: 20 }}>
            Conta criada com sucesso!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 8px', lineHeight: 1.6 }}>
            Bem-vindo à Zynplan, <strong style={{ color: '#d4a843' }}>{nomeUsuario.split(' ')[0] || nomeEmpresa}</strong>! 🎉
          </p>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 32px' }}>
            Seu trial de <strong style={{ color: '#d4a843' }}>14 dias grátis</strong> começou agora.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 4, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{
              height: '100%', borderRadius: 100,
              background: 'linear-gradient(135deg, #b8893d, #d4a843)',
              animation: 'progresso 2.5s linear forwards',
            }} />
          </div>
          <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Preparando seu painel...</p>

          <style>{`
            @keyframes progresso {
              from { width: 0%; }
              to   { width: 100%; }
            }
          `}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={container}>
      <div style={card}>
        <div style={logoArea}>
          <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan"
            style={{ width: 180, display: 'block', margin: '0 auto 4px', mixBlendMode: 'screen' as const }} />
          <p style={logoSub}>Crie sua conta gratuitamente</p>
        </div>

        <form onSubmit={cadastrar}>
          <label style={label}>Seu Nome *</label>
          <input placeholder="Ex: João Silva" value={nomeUsuario}
            onChange={e => setNomeUsuario(e.target.value)} style={input} />

          <label style={label}>Nome da Empresa</label>
          <input placeholder="Ex: Construtora Silva" value={nomeEmpresa}
            onChange={e => setNomeEmpresa(e.target.value)} style={input} />

          <label style={label}>Email *</label>
          <input type="email" placeholder="seu@email.com" value={email}
            onChange={e => setEmail(e.target.value)} required style={input} />

          <label style={label}>Senha * (mín. 6 caracteres)</label>
          <input type="password" placeholder="••••••••" value={senha}
            onChange={e => setSenha(e.target.value)} minLength={6} required style={input} />

          <label style={label}>Confirmar Senha *</label>
          <input type="password" placeholder="••••••••" value={confirmSenha}
            onChange={e => setConfirmSenha(e.target.value)} required style={input} />

          {erro && <p style={erroStyle}>{erro}</p>}

          <p style={{ fontSize: 11, color: '#475569', textAlign: 'center' as const, marginTop: 14, lineHeight: 1.5 }}>
            Ao criar sua conta você terá acesso gratuito. A cobrança só começa ao assinar um plano.
          </p>
          <button type="submit" style={{ ...botao, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
            {loading ? 'Criando conta...' : '🚀 Criar conta grátis'}
          </button>
        </form>

        <p style={linkLogin}>
          Já tem conta?{' '}
          <span onClick={() => router.push('/login')} style={link}>Fazer login</span>
        </p>
      </div>
    </div>
  )
}

const container: React.CSSProperties = { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000000', padding: 20 }
const card: React.CSSProperties      = { background: '#0a0a0a', padding: '32px 36px', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid #1a1a1a' }
const logoArea: React.CSSProperties  = { textAlign: 'center', marginBottom: 24 }
const logoSub: React.CSSProperties   = { fontSize: 13, color: '#64748b', marginTop: 8 }
const label: React.CSSProperties     = { display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4, marginTop: 14 }
const input: React.CSSProperties     = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1e293b', background: '#111111', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }
const erroStyle: React.CSSProperties = { color: '#f87171', fontSize: 13, marginTop: 10, background: '#450a0a', padding: '8px 12px', borderRadius: 6, lineHeight: 1.6 }
const botao: React.CSSProperties     = { width: '100%', padding: 13, marginTop: 20, background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700 }
const linkLogin: React.CSSProperties = { textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }
const link: React.CSSProperties      = { color: '#d4a843', cursor: 'pointer' }