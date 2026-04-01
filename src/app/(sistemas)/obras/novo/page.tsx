'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function NovaObra() {
  const empresaId = useEmpresa()
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [cliente, setCliente] = useState('')
  const [valor, setValor] = useState('')

  async function salvar(e: any) {
  e.preventDefault()

  try {
    if (!empresaId) {
      alert('Erro de empresa')
      return
    }

    // 🔒 EMPRESA
    const { data: empresa, error: erroEmpresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single()

    if (erroEmpresa) {
      console.error('Erro empresa:', erroEmpresa)
      alert('Erro ao buscar empresa')
      return
    }

    // 🔒 CONTAR OBRAS
    const { count, error: erroCount } = await supabase
      .from('obras')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)

    if (erroCount) {
      console.error('Erro count:', erroCount)
      alert('Erro ao contar obras')
      return
    }

    if (empresa?.plano === 'free' && (count || 0) >= 3) {
      alert('Limite de obras atingido no plano Free')
      return
    }

    // ✅ SALVAR OBRA
    const { error: erroInsert } = await supabase
      .from('obras')
      .insert([
        {
          nome,
          cliente_nome: cliente,
          valor_total: Number(valor),
          empresa_id: empresaId
        }
      ])

    if (erroInsert) {
      console.error('Erro insert:', erroInsert)
      alert('Erro ao salvar obra')
      return
    }

    router.push('/obras')

  } catch (err) {
    console.error(err)
    alert('Erro inesperado')
  }
}

  return (
    <div style={{ padding: 24 }}>
      <h1>Nova Obra</h1>

      <form onSubmit={salvar} style={{ marginTop: 20 }}>
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
  marginBottom: 10,
  padding: 10,
  width: 300
}

const botao = {
  background: 'green',
  color: '#fff',
  padding: 10,
  border: 'none',
  borderRadius: 6
}