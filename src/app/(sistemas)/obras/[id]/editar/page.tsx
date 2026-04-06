'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function EditarObra() {

  const { empresaId } = useEmpresa()
  const { id } = useParams()
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [cliente, setCliente] = useState('')
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!empresaId || !id) return
    buscar()
  }, [empresaId, id])

  async function buscar() {

    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .eq('id', Number(id))
      .eq('empresa_id', empresaId)
      .single()

    if (error) {
      console.error(error)
      alert('Erro ao carregar obra')
      return
    }

    if (data) {
      setNome(data.nome)
      setCliente(data.cliente)
      setValor(data.valor)
    }
  }

  async function salvar(e: any) {
    e.preventDefault()

    if (!nome || !cliente || !valor) {
      alert('Preencha todos os campos')
      return
    }

    if (Number(valor) <= 0) {
      alert('Valor inválido')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('obras')
      .update({
        nome,
        cliente,
        valor: Number(valor),
      })
      .eq('id', Number(id))

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

        <h1 style={titulo}>✏️ Editar Obra</h1>

        <form onSubmit={salvar} style={form}>

          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={input}
            placeholder="Nome da obra"
          />

          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            style={input}
            placeholder="Cliente"
          />

          <input
            value={valor}
            type="number"
            onChange={(e) => setValor(e.target.value)}
            style={input}
            placeholder="Valor"
          />

          <button style={botao} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
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
  flexDirection:'column',
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