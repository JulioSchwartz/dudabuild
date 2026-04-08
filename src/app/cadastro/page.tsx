'use client'
 
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
 
export default function Cadastro() {
  const router = useRouter()
 
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [email,       setEmail]       = useState('')
  const [senha,       setSenha]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [erro,        setErro]        = useState('')
 
  async function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
 
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha todos os campos obrigatórios')
      return
    }
 
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres')
      return
    }
 
    setLoading(true)
 
    try {
      // 1️⃣ Cria usuário no Auth
      const { data, error } = await supabase.auth.signUp({ email, password: senha })
 
      if (error) {
        if (error.message.includes('already registered')) {
          setErro('Este email já está cadastrado. Faça login.')
        } else {
          setErro(error.message)
        }
        return
      }
 
      const user = data.user
      if (!user) {
        setErro('Erro ao criar usuário. Tente novamente.')
        return
      }
 
      // 2️⃣ Cria empresa com status 'incomplete'
      //    (será atualizado para 'active' após pagamento via webhook)
      const { data: empresa, error: erroEmpresa } = await supabase
        .from('empresas')
        .insert({
          nome:   nomeEmpresa.trim() || email,
          plano:  'basico',
          status: 'incomplete',
        })
        .select()
        .single()
 
      if (erroEmpresa || !empresa) {
        setErro('Erro ao criar empresa. Tente novamente.')
        return
      }
 
      // 3️⃣ Vincula usuário à empresa
      const { error: erroUsuario } = await supabase
        .from('usuarios')
        .insert({
          email,
          nome:       nomeUsuario.trim() || email,
          user_id:    user.id,
          empresa_id: empresa.id,
          is_admin:   false,
        })
 
      if (erroUsuario) {
        setErro('Erro ao vincular usuário. Tente novamente.')
        return
      }
 
      // 4️⃣ Redireciona para escolha de plano e pagamento
      router.push('/planos')
 
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
          <p style={logoSub}>Crie sua conta gratuitamente</p>
        </div>
 
        <form onSubmit={cadastrar}>
 
          <label style={label}>Nome da Empresa</label>
          <input
            placeholder="Ex: Construtora Silva"
            value={nomeEmpresa}
            onChange={e => setNomeEmpresa(e.target.value)}
            style={input}
          />
 
          <label style={label}>Seu Nome</label>
          <input
            placeholder="Ex: João Silva"
            value={nomeUsuario}
            onChange={e => setNomeUsuario(e.target.value)}
            style={input}
          />
 
          <label style={label}>Email *</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={input}
          />
 
          <label style={label}>Senha * (mín. 6 caracteres)</label>
          <input
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            minLength={6}
            required
            style={input}
          />
 
          {erro && <p style={erroStyle}>{erro}</p>}
 
          <button type="submit" style={botao} disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
 
        </form>
 
        <p style={linkLogin}>
          Já tem conta?{' '}
          <span onClick={() => router.push('/login')} style={link}>
            Fazer login
          </span>
        </p>
 
      </div>
    </div>
  )
}
 
/* ================= ESTILOS ================= */
 
const container: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#0f172a',
  padding: 20,
}
 
const card: React.CSSProperties = {
  background: '#1e293b',
  padding: 36,
  borderRadius: 16,
  width: '100%',
  maxWidth: 400,
  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
}
 
const logoArea: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 28,
}
 
const logoTitulo: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  color: '#fff',
}
 
const logoSub: React.CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
  marginTop: 4,
}
 
const label: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 4,
  marginTop: 14,
}
 
const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0f172a',
  color: '#f1f5f9',
  fontSize: 14,
  boxSizing: 'border-box',
}
 
const erroStyle: React.CSSProperties = {
  color: '#f87171',
  fontSize: 13,
  marginTop: 10,
  background: '#450a0a',
  padding: '8px 12px',
  borderRadius: 6,
}
 
const botao: React.CSSProperties = {
  width: '100%',
  padding: 13,
  marginTop: 20,
  background: '#22c55e',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
}
 
const linkLogin: React.CSSProperties = {
  textAlign: 'center',
  marginTop: 18,
  fontSize: 13,
  color: '#64748b',
}
 
const link: React.CSSProperties = {
  color: '#38bdf8',
  cursor: 'pointer',
}