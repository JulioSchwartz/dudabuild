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