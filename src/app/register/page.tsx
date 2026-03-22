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

    const empresa_id = crypto.randomUUID()

    await supabase.from('usuarios').insert([
      {
        email,
        senha,
        empresa_id,
      },
    ])

    alert('Usuário criado com sucesso')

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