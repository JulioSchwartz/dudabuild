'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Cadastro() {
  const router = useRouter()

  const [nomeEmpresa,  setNomeEmpresa]  = useState('')
  const [nomeUsuario,  setNomeUsuario]  = useState('')
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [enviado,      setEnviado]      = useState(false)
  const [erro,         setErro]         = useState('')

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!email.trim() || !senha.trim()) { setErro('Preencha todos os campos obrigatórios'); return }
    if (senha.length < 6)               { setErro('A senha deve ter no mínimo 6 caracteres'); return }
    if (senha !== confirmSenha)         { setErro('As senhas não coincidem'); return }
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({ email, password: senha })
      if (error) {
        setErro(error.message.includes('already registered') ? 'Este email já está cadastrado. Faça login.' : error.message)
        return
      }
      const user = data.user
      if (!user) { setErro('Erro ao criar usuário.'); return }

      const { data: empresa, error: erroEmpresa } = await supabase
        .from('empresas')
        .insert({ nome: nomeEmpresa.trim() || email, plano: 'basico', status: 'incomplete' })
        .select().single()
      if (erroEmpresa || !empresa) { setErro('Erro ao criar empresa.'); return }

      const { error: erroUsuario } = await supabase
        .from('usuarios')
        .insert({ email, user_id: user.id, empresa_id: empresa.id, is_admin: false })
      if (erroUsuario) { setErro('Erro ao vincular usuário.'); return }

      setEnviado(true)
    } catch (err) {
      console.error(err)
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div style={container}>
        <div style={card}>
          <div style={logoArea}>
            <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan" style={{ width: 180, display: 'block', margin: '0 auto' }} />
          </div>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ fontSize: 48 }}>📧</p>
            <h2 style={{ color: '#fff', fontWeight: 800, marginTop: 12 }}>Confirme seu email</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 10, lineHeight: 1.7 }}>
              Enviamos um link de confirmação para<br />
              <strong style={{ color: '#d4a843' }}>{email}</strong>
            </p>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
              Clique no link do email para ativar sua conta. Verifique também a caixa de spam.
            </p>
            <button onClick={() => router.push('/login')} style={{ ...botao, marginTop: 24 }}>
              Ir para o login
            </button>
            <p style={{ color: '#475569', fontSize: 12, marginTop: 14 }}>
              Não recebeu?{' '}
              <span onClick={() => setEnviado(false)} style={{ color: '#d4a843', cursor: 'pointer' }}>
                Tentar novamente
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={container}>
      <div style={card}>
        <div style={logoArea}>
          <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan" style={{ width: 180, display: 'block', margin: '0 auto 4px' }} />
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

          <p style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            Ao criar sua conta você terá acesso gratuito. A cobrança só começa ao assinar um plano.
          </p>
          <button type="submit" style={botao} disabled={loading}>
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
const erroStyle: React.CSSProperties = { color: '#f87171', fontSize: 13, marginTop: 10, background: '#450a0a', padding: '8px 12px', borderRadius: 6 }
const botao: React.CSSProperties     = { width: '100%', padding: 13, marginTop: 20, background: 'linear-gradient(135deg, #b8893d, #d4a843)', color: '#000', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const linkLogin: React.CSSProperties = { textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }
const link: React.CSSProperties      = { color: '#d4a843', cursor: 'pointer' }