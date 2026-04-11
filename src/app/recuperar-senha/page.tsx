'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RecuperarSenha() {
  const router = useRouter()

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro,    setErro]    = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setErro('Informe seu email'); return }
    setErro('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/nova-senha`,
      })
      if (error) throw error
      setEnviado(true)
    } catch (err: any) {
      setErro('Erro ao enviar email. Verifique o endereço informado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={container}>
      <div style={card}>
        <div style={logoArea}>
          <h1 style={logoTitulo}>🏗️ DudaBuild</h1>
          <p style={logoSub}>Recuperar senha</p>
        </div>

        {enviado ? (
          <div style={sucessoBox}>
            <p style={{ fontSize: 32, textAlign: 'center' }}>📧</p>
            <p style={{ fontWeight: 700, color: '#fff', textAlign: 'center', marginTop: 8 }}>
              Email enviado!
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6, lineHeight: 1.6 }}>
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </p>
            <button onClick={() => router.push('/login')} style={btnVoltar}>
              Voltar ao login
            </button>
          </div>
        ) : (
          <form onSubmit={enviar}>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
              Digite seu email e enviaremos um link para você criar uma nova senha.
            </p>

            <label style={label}>Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={input}
            />

            {erro && <p style={erroStyle}>{erro}</p>}

            <button type="submit" style={botao} disabled={loading}>
              {loading ? 'Enviando...' : '📧 Enviar link de recuperação'}
            </button>
          </form>
        )}

        <p style={linkLogin}>
          Lembrou a senha?{' '}
          <span onClick={() => router.push('/login')} style={link}>Fazer login</span>
        </p>
      </div>
    </div>
  )
}

const container: React.CSSProperties = { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', padding: 20 }
const card: React.CSSProperties      = { background: '#1e293b', padding: 36, borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }
const logoArea: React.CSSProperties  = { textAlign: 'center', marginBottom: 28 }
const logoTitulo: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#fff' }
const logoSub: React.CSSProperties   = { fontSize: 13, color: '#94a3b8', marginTop: 4 }
const label: React.CSSProperties     = { display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4, marginTop: 14 }
const input: React.CSSProperties     = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }
const erroStyle: React.CSSProperties = { color: '#f87171', fontSize: 13, marginTop: 10, background: '#450a0a', padding: '8px 12px', borderRadius: 6 }
const botao: React.CSSProperties     = { width: '100%', padding: 13, marginTop: 20, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const btnVoltar: React.CSSProperties = { width: '100%', padding: 12, marginTop: 20, background: '#334155', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }
const sucessoBox: React.CSSProperties = { background: '#0f172a', borderRadius: 12, padding: 24, marginBottom: 8 }
const linkLogin: React.CSSProperties = { textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }
const link: React.CSSProperties      = { color: '#38bdf8', cursor: 'pointer' }