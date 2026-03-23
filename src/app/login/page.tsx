'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function entrar(e: any) {
    e.preventDefault()

    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .single()

    if (!data) {
      alert('Login inválido')
      return
    }

    localStorage.setItem('empresa_id', data.empresa_id)

    router.push('/')
  }

  return (
    <div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '50px',
  }}
>
      <h1>Login</h1>

      <form onSubmit={entrar}>
        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
  placeholder="Email"
  onChange={(e) => setEmail(e.target.value)}
  style={{
    display: 'block',
    marginBottom: '10px',
    padding: '10px',
    width: '250px',
  }}
/>

        <button
  style={{
    background: '#2563eb',
    color: '#fff',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
  }}
>
  Entrar
</button>

const container = {
  display: 'flex',
  flexDirection: 'column' as 'column',
  alignItems: 'center',
  marginTop: '50px',
}

const input = {
  display: 'block',
  marginBottom: '10px',
  padding: '10px',
  width: '250px',
} as React.CSSProperties

const botao = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
} as React.CSSProperties