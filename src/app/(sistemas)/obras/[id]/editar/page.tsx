'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function EditarObra() {
  const empresaId = useEmpresa()
  const { id } = useParams()
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [cliente, setCliente] = useState('')
  const [valor, setValor] = useState('')

  useEffect(() => {
    buscar()
  }, [])

  async function buscar() {
    const { data } = await supabase
      .from('obras')
      .select('*')
      .eq('empresa_id', empresaId)
      .single()

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

    await supabase
      .from('obras')
      .update({
        nome,
        cliente,
        valor: Number(valor),
      })
      .eq('id', id)

    router.push('/obras')
  }

  return (
    <div>
      <h1>Editar Obra</h1>

      <form onSubmit={salvar} style={{ marginTop: '20px' }}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} style={input} />
        <input value={cliente} onChange={(e) => setCliente(e.target.value)} style={input} />
        <input
          value={valor}
          type="number"
          onChange={(e) => setValor(e.target.value)}
          style={input}
        />

        <button style={botao}>Salvar Alterações</button>
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
  background: 'orange',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
}