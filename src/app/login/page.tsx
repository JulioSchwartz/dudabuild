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

    // 🔐 LOGIN
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error || !data.user) {
      setErro('Email ou senha inválidos')
      setLoading(false)
      return
    }

    const user = data.user

    // ✅ GARANTE USUÁRIO NA TABELA
    const { error: upsertError } = await supabase
      .from('usuarios')
      .upsert(
        {
          email: user.email,
          user_id: user.id,
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      setErro('Erro ao sincronizar usuário')
      setLoading(false)
      return
    }

    // 🔍 VERIFICA SE TEM EMPRESA
    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (erroUsuario) {
      setErro('Erro ao carregar usuário')
      setLoading(false)
      return
    }

    // 🚨 SE NÃO TEM EMPRESA → CRIAR AUTOMATICAMENTE
    if (!usuario?.empresa_id) {
      const { data: novaEmpresa, error: erroEmpresa } = await supabase
        .from('empresas')
        .insert({
          nome: user.email,
          plano: 'free'
        })
        .select()
        .single()

      if (erroEmpresa || !novaEmpresa) {
        setErro('Erro ao criar empresa')
        setLoading(false)
        return
      }

      // 🔗 VINCULA USUÁRIO À EMPRESA
      const { error: vinculoError } = await supabase
        .from('usuarios')
        .update({
          empresa_id: novaEmpresa.id
        })
        .eq('user_id', user.id)

      if (vinculoError) {
        setErro('Erro ao vincular empresa')
        setLoading(false)
        return
      }
    }

    // 🚀 REDIRECIONA (SEM LOCALSTORAGE!)
    router.push('/dashboard')
  }

const container = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  background: '#0f172a',
}

const card = {
  background: '#1e293b',
  padding: '30px',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '400px',
  color: '#fff',
}

const titulo = {
  fontSize: '24px',
  marginBottom: '10px',
}

const subtitulo = {
  marginBottom: '20px',
  color: '#cbd5f5',
}

const input = {
  width: '100%',
  padding: '10px',
  marginBottom: '15px',
  borderRadius: '8px',
  border: 'none',
}

const senhaBox = {
  position: 'relative' as const,
  marginBottom: '15px',
}

const toggleSenha = {
  position: 'absolute' as const,
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  cursor: 'pointer',
}

const botao = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  background: '#22c55e',
  color: '#fff',
  cursor: 'pointer',
}

const erroStyle = {
  color: 'red',
  marginBottom: '10px',
}

const linkCadastro = {
  marginTop: '15px',
  fontSize: '14px',
}

const link = {
  color: '#38bdf8',
  cursor: 'pointer',
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