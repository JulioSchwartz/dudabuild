'use client'

import { useState } from 'react'
import { obras } from '@/lib/data'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NovaObra() {
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [cliente, setCliente] = useState('')
  const [valor, setValor] = useState('')

  async function salvar(e: any) {
    e.preventDefault()

const empresa_id = localStorage.getItem('empresa_id')

await supabase.from('obras').insert([
  {
    nome,
    cliente,
    valor: Number(valor),
    empresa_id,
  },
])

    router.push('/obras')
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Nova Obra</h1>

      <form onSubmit={salvar} style={{ marginTop: '20px' }}>
        <input placeholder="Nome" onChange={(e) => setNome(e.target.value)} style={input} />
        <input placeholder="Cliente" onChange={(e) => setCliente(e.target.value)} style={input} />
        <input placeholder="Valor" type="number" onChange={(e) => setValor(e.target.value)} style={input} />

        <button style={botao}>Salvar</button>
      </form>
    </div>
  )
}

const input = {
  display: 'block',
  marginBottom: '10px',
  padding: '10px',
  width: '300px',
}

const botao = {
  background: 'green',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
}