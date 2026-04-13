'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NovaSenha() {
  const router = useRouter()
  const [senha,        setSenha]        = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [mostrar,      setMostrar]      = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [erro,         setErro]         = useState('')
  const [salvo,        setSalvo]        = useState(false)
  const [sessaoOk,     setSessaoOk]     = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type         = params.get('type')

    if (accessToken && type === 'recovery') {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' })
        .then(({ error }) => {
          if (error) setErro('Link inválido ou expirado. Solicite um novo.')
          else setSessaoOk(true)
        })
      return
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessaoOk(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6)       { setErro('Senha deve ter no mínimo 6 caracteres'); return }
    if (senha !== confirmSenha) { setErro('As senhas não coincidem'); return }
    setErro('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) throw error
      setSalvo(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setErro('Erro ao atualizar senha. O link pode ter expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={container}>
      <div style={card}>
        <div style={logoArea}>
          <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan" style={{ width: 240, display: 'block', margin: '0 auto 4px' }} />
          <p style={logoSub}>Criar nova senha</p>
        </div>

        {salvo ? (
          <div style={sucessoBox}>
            <p style={{ fontSize: 32, textAlign: 'center' }}>✅</p>
            <p style={{ fontWeight: 700, color: '#fff', textAlign: 'center', marginTop: 8 }}>Senha atualizada!</p>
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>Redirecionando para o login...</p>
          </div>
        ) : !sessaoOk ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {erro ? (
              <>
                <p style={{ fontSize: 32 }}>❌</p>
                <p style={erroStyle}>{erro}</p>
                <button onClick={() => router.push('/recuperar-senha')} style={{ ...botao, background: '#1a1a1a', color: '#fff', marginTop: 20 }}>
                  Solicitar novo link
                </button>
              </>
            ) : (
              <>
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Verificando link...</p>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>Se demorar, volte ao email e clique no link novamente.</p>
                <button onClick={() => router.push('/recuperar-senha')} style={{ ...botao, background: '#1a1a1a', color: '#fff', marginTop: 20 }}>
                  Solicitar novo link
                </button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={salvar}>
            <label style={label}>Nova senha</label>
            <div style={{ position: 'relative' }}>
              <input type={mostrar ? 'text' : 'password'} placeholder="••••••••"
                value={senha} onChange={e => setSenha(e.target.value)}
                required minLength={6} style={{ ...input, paddingRight: 40 }} />
              <span onClick={() => setMostrar(!mostrar)} style={olho}>{mostrar ? '🙈' : '👁'}</span>
            </div>
            <label style={{ ...label, marginTop: 14 }}>Confirmar nova senha</label>
            <input type={mostrar ? 'text' : 'password'} placeholder="••••••••"
              value={confirmSenha} onChange={e => setConfirmSenha(e.target.value)}
              required style={input} />
            {erro && <p style={erroStyle}>{erro}</p>}
            <button type="submit" style={botao} disabled={loading}>
              {loading ? 'Salvando...' : '🔒 Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const container: React.CSSProperties  = { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000000', padding: 20 }
const card: React.CSSProperties       = { background: '#0a0a0a', padding: '32px 36px', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid #1a1a1a' }
const logoArea: React.CSSProperties   = { textAlign: 'center', marginBottom: 28 }
const logoSub: React.CSSProperties    = { fontSize: 13, color: '#64748b', marginTop: 8 }
const label: React.CSSProperties      = { display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4, marginTop: 14 }
const input: React.CSSProperties      = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #1e293b', background: '#111111', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' }
const olho: React.CSSProperties       = { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 16 }
const erroStyle: React.CSSProperties  = { color: '#f87171', fontSize: 13, marginTop: 10, background: '#450a0a', padding: '8px 12px', borderRadius: 6 }
const botao: React.CSSProperties      = { width: '100%', padding: 13, marginTop: 20, background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const sucessoBox: React.CSSProperties = { background: '#111111', borderRadius: 12, padding: 24 }