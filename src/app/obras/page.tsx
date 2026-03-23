'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Obras() {
  const router = useRouter()
  const [obras, setObras] = useState<any[]>([])

  useEffect(() => {
    const empresa = localStorage.getItem('empresa_id')

    if (!empresa) {
      router.push('/login')
    } else {
      buscar()
    }
  }, [])

  async function buscar() {
    const empresa_id = localStorage.getItem('empresa_id')

    const { data } = await supabase
      .from('obras')
      .select('*')
      .eq('empresa_id', empresa_id)
      .order('id', { ascending: false })

    setObras(data || [])
  }

  async function excluir(id: number) {
    const confirmar = confirm('Deseja excluir esta obra?')
    if (!confirmar) return

    await supabase.from('financeiro').delete().eq('obra_id', id)
    await supabase.from('obras').delete().eq('id', id)

    buscar()
  }

  return (
    <div>
      <div style={header}>
        <h1 style={{ color: '#0f172a' }}>Obras</h1>

        <Link href="/obras/nova">
          <button style={btnNova}>+ Nova Obra</button>
        </Link>
      </div>

      <div style={grid}>
        {obras.map((obra) => (
          <div key={obra.id} style={card}>
            <h3 style={{ color: '#0f172a' }}>{obra.nome}</h3>
            <p style={{ color: '#64748b' }}>{obra.cliente}</p>

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

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
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
}

const botoes = {
  marginTop: '10px',
  display: 'flex',
  gap: '10px',
}

const btnNova = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
}

const btnVer = {
  background: '#22c55e',
  color: '#fff',
  border: 'none',
  padding: '8px',
  borderRadius: '6px',
  cursor: 'pointer',
}

const btnExcluir = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: '8px',
  borderRadius: '6px',
  cursor: 'pointer',
}