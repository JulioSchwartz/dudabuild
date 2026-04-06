'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function NovaObra() {

  const { empresaId } = useEmpresa()
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [cliente, setCliente] = useState('')
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)

  async function salvar(e:any) {
    e.preventDefault()

    if (!empresaId) return alert('Erro empresa')

    if (!nome || !cliente || !valor) {
      alert('Preencha todos os campos')
      return
    }

    if (Number(valor) <= 0) {
      alert('Valor inválido')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('obras').insert({
      nome,
      cliente,
      valor: Number(valor),
      empresa_id: empresaId
    })

    if (error) {
      console.error(error)
      alert('Erro ao salvar')
      setLoading(false)
      return
    }

    router.push('/obras')
  }

  return (
    <div style={container}>

      <div style={card}>

        <h1 style={titulo}>🏗️ Nova Obra</h1>

        <form onSubmit={salvar} style={form}>

          <input
            value={nome}
            onChange={e=>setNome(e.target.value)}
            placeholder="Nome da obra"
            style={input}
          />

          <input
            value={cliente}
            onChange={e=>setCliente(e.target.value)}
            placeholder="Nome do cliente"
            style={input}
          />

          <input
            value={valor}
            onChange={e=>setValor(e.target.value)}
            placeholder="Valor do contrato"
            style={input}
          />

          <button style={botao} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Obra'}
          </button>

        </form>

      </div>

    </div>
  )
}

/* UI */

const container = {
  background:'#f1f5f9',
  minHeight:'100vh',
  display:'flex',
  justifyContent:'center',
  alignItems:'center'
}

const card = {
  background:'#fff',
  padding:30,
  borderRadius:12,
  width:400,
  boxShadow:'0 10px 30px rgba(0,0,0,0.05)'
}

const titulo = {
  marginBottom:20
}

const form = {
  display:'flex',
  flexDirection:'column' as const,
  gap:12
}

const input = {
  padding:12,
  borderRadius:8,
  border:'1px solid #e2e8f0'
}

const botao = {
  background:'#2563eb',
  color:'#fff',
  padding:12,
  borderRadius:8,
  border:'none',
  fontWeight:600,
  cursor:'pointer'
}