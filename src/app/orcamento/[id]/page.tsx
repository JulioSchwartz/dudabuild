'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OrcamentoPublico() {

  const { id } = useParams()
  const [orc, setOrc] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])

  useEffect(() => {
    if (id) carregar()
  }, [id])

  async function carregar() {

    const { data } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .single()

    setOrc(data)

    const { data: itens } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)

    setItens(itens || [])
  }

  if (!orc) return <p style={{ padding: 40 }}>Carregando...</p>

  return (
    <div style={{ padding: 40, fontFamily: 'Arial' }}>

      <h1>Proposta Comercial</h1>

      <p><b>Cliente:</b> {orc.cliente_nome}</p>
      <p><b>Descrição:</b> {orc.descricao}</p>

      <hr />

      {itens.map((i, idx) => (
        <p key={idx}>
          {i.descricao} - {i.quantidade}x - R$ {i.valor_total}
        </p>
      ))}

      <hr />

      <h2>Total: R$ {orc.valor_total}</h2>

    </div>
  )
}