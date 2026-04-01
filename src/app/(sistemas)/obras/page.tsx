'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function Obras() {

  const empresaId = useEmpresa()
  const router = useRouter()
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const empresa = localStorage.getItem('empresa_id')

    if (!empresa) {
      router.push('/login')
      return
    }

    if (empresaId) {
      buscar()
    }
  }, [empresaId])

  async function buscar() {

    if (!empresaId) return

    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .eq('empresa_id', empresaId)

    if (!error && data) {
      setObras(data)
    }

    setLoading(false)
  }

  async function excluir(id: number) {
    const confirmar = confirm('Deseja excluir esta obra?')
    if (!confirmar) return

    await supabase.from('financeiro').delete().eq('obra_id', id)
    await supabase.from('obras').delete().eq('id', id)

    buscar()
  }

  // 🔥 LOADER GLOBAL
  if (!empresaId) return <Loader />

  // 🔥 LOADING
  if (loading) return <Loader />

  return (
    <div>
      <div style={header}>
        <h1 style={titulo}>Obras</h1>

        <Link href="/obras/nova">
          <button style={btnNova}>+ Nova Obra</button>
        </Link>
      </div>

      <div style={grid}>
        {obras.map((obra) => (
          <div key={obra.id} style={card}>
            <h3 style={nome}>{obra.nome}</h3>
            <p style={cliente}>{obra.cliente}</p>

            {/* 💰 VALOR DA OBRA */}
            <p style={valorObra}>
              💰 {Number(obra.valor || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>

            <div style={botoes}>
              <Link href={`/obras/${obra.id}`}>
                <button style={btnVer}>Ver</button>
              </Link>

              <button
                onClick={() => excluir(obra.id)}
                style={btnExcluir}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
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

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
}

const titulo = {
  color: '#0f172a',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
}

const card = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  border: '1px solid #e2e8f0',
}

const nome = {
  color: '#0f172a',
  marginBottom: '5px',
}

const cliente = {
  color: '#64748b',
}

const valorObra = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#16a34a',
  marginTop: '4px',
}

const botoes = {
  marginTop: '10px',
  display: 'flex',
  gap: '10px',
}

const btnNova = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px 14px',
  border: 'none',
  borderRadius: '8px',
  fontWeight: '500',
}

const btnVer = {
  background: '#22c55e',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
}

const btnExcluir = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
}