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

    if (!email || !senha) {
      setErro('Preencha email e senha')
      return
    }

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
        {
          onConflict: 'user_id',
        }
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
          plano: 'basico',
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
          empresa_id: novaEmpresa.id,
        })
        .eq('user_id', user.id)

      if (vinculoError) {
        setErro('Erro ao vincular empresa')
        setLoading(false)
        return
      }
    }

    // 🚀 REDIRECIONA
    router.push('/dashboard')
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0f172a',
      }}
    >
      <div
        style={{
          background: '#1e293b',
          padding: '30px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '400px',
          color: '#fff',
        }}
      >
        <h1>🏗️ DudaBuild</h1>
        <p style={{ marginBottom: '20px', color: '#cbd5f5' }}>
          Acesse sua conta
        </p>

        <form onSubmit={entrar}>
          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
            }}
          />

          <div style={{ position: 'relative', marginBottom: '15px' }}>
            <input
              placeholder="Senha"
              type={mostrarSenha ? 'text' : 'password'}
              onChange={(e) => setSenha(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
              }}
            />

            <span
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
              }}
            >
              {mostrarSenha ? '🙈' : '👁'}
            </span>
          </div>

          {erro && (
            <p style={{ color: 'red', marginBottom: '10px' }}>{erro}</p>
          )}

          <button
            style={{
              width: '100%',
              padding: '12px',
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
            }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p style={{ marginTop: '15px', fontSize: '14px' }}>
            Não tem conta?{' '}
            <span
              onClick={() => router.push('/cadastro')}
              style={{ color: '#38bdf8', cursor: 'pointer' }}
            >
              Criar agora
            </span>
          </p>
        </form>
      </div>
    </div>
  )
}