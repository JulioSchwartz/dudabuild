'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Register() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function cadastrar(e: any) {
  e.preventDefault()

  if (!email || !senha) {
    alert('Preencha todos os campos')
    return
  }

  // 🔐 cria usuário no AUTH
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
  })

  if (error || !data.user) {
    alert(error?.message || 'Erro ao cadastrar')
    return
  }

  const user = data.user

  // 🏢 cria empresa
  const { data: empresa, error: erroEmpresa } = await supabase
    .from('empresas')
    .insert({
      nome: email,
      plano: 'admin', // 👈 primeiro usuário = ADMIN
    })
    .select()
    .single()

  if (erroEmpresa || !empresa) {
    alert('Erro ao criar empresa')
    return
  }

  // 👤 cria usuário vinculado
  await supabase.from('usuarios').insert({
    email: user.email,
    user_id: user.id,
    empresa_id: empresa.id
  })

  alert('Conta criada!')
  router.push('/login')
}

  return (
    <div style={container}>
      <h1>Criar Conta</h1>

      <form onSubmit={cadastrar}>
        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          placeholder="Senha"
          type="password"
          onChange={(e) => setSenha(e.target.value)}
          style={input}
        />

        <button style={botao}>Cadastrar</button>
      </form>
    </div>
  )
}

const container = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '100px',
}

const input = {
  display: 'block',
  marginBottom: '10px',
  padding: '10px',
  width: '250px',
}

const botao = {
  background: '#22c55e',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
}