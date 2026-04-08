'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [novoEmail, setNovoEmail] = useState('')

  async function carregar() {
    const { data } = await supabase
      .from('usuarios')
      .select('*')

    setUsuarios(data || [])
  }

  async function criar() {
    const { data: user } = await supabase.auth.getUser()

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.user.id)
      .single()

    await fetch('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        email: novoEmail,
        empresaId: usuario.empresa_id
      })
    })

    alert('Usuário criado!')
    carregar()
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <div>
      <h1>Usuários</h1>

      <input
        placeholder="Email"
        onChange={(e) => setNovoEmail(e.target.value)}
      />

      <button onClick={criar}>Criar usuário</button>

      <ul>
        {usuarios.map((u: any) => (
          <li key={u.id}>{u.email}</li>
        ))}
      </ul>
    </div>
  )
}