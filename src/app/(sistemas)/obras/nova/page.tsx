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
  const [loading, setLoading] = useState(false)

  async function salvar(e: any) {
    e.preventDefault()

    try {
      if (!empresaId) {
        alert('Erro de empresa')
        return
      }

      setLoading(true)

      // 🔒 EMPRESA
      const { data: empresa, error: erroEmpresa } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single()

      if (erroEmpresa) {
        console.error('Erro empresa:', erroEmpresa)
        alert('Erro ao buscar empresa')
        setLoading(false)
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
        setLoading(false)
        return
      }

      if (empresa?.plano === 'free' && (count || 0) >= 3) {
        alert('Limite de obras atingido no plano Free')
        setLoading(false)
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
        setLoading(false)
        return
      }

      router.push('/obras')

    } catch (err) {
      console.error(err)
      alert('Erro inesperado')
      setLoading(false)
    }
  }

  // 🔥 LOADER GLOBAL
  if (!empresaId) return <Loader />

  return (
    <div style={{ padding: 24 }}>
      <h1>Nova Obra</h1>

      <form onSubmit={salvar} style={{ marginTop: 20 }}>
        <input
          placeholder="Nome da Obra"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={input}
        />

        <input
          placeholder="Cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          style={input}
        />

        <input
          placeholder="Valor da Obra"
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={input}
        />

        <button style={botao}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}

/* 🔥 LOADER */
function Loader() {
  return (
    <div style={loaderContainer}>
      <div style={spinner}></div>
      <p>Carregando...</p>
    </div>
  )
}

/* 🎨 ESTILO */

const loaderContainer = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  height: '60vh',
}

const spinner = {
  width: 40,
  height: 40,
  border: '4px solid #e2e8f0',
  borderTop: '4px solid #2563eb',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
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
  borderRadius: 6,
  cursor: 'pointer'
}