'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ClienteObra() {
  const { id } = useParams()

  const [fotos, setFotos] = useState<any[]>([])
  const [obra, setObra] = useState<any>(null)
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data: obraData } = await supabase
      .from('obras')
      .select('*')
      .eq('id', Number(id))
      .single()

    const { data: fotosData } = await supabase
      .from('obra_fotos')
      .select('*')
      .eq('obra_id', Number(id))
      .order('created_at', { ascending: false })

    setObra(obraData)
    setFotos(fotosData || [])
  }

  const fachada = fotos.filter((f) => f.tipo === 'fachada')
  const interior = fotos.filter((f) => f.tipo === 'interior')

  return (
    <div style={container}>
      {/* HEADER */}
      <div style={header}>
        <h1 style={titulo}>📸 Acompanhamento da Obra</h1>
        <p style={subtitulo}>
          {obra?.nome} • {obra?.cliente}
        </p>
      </div>

      {/* FACHADA */}
      <Secao titulo="Fachada" fotos={fachada} onClick={setFotoSelecionada} />

      {/* INTERIOR */}
      <Secao titulo="Interior" fotos={interior} onClick={setFotoSelecionada} />

      {/* MODAL */}
      {fotoSelecionada && (
        <div style={modal} onClick={() => setFotoSelecionada(null)}>
          <img src={fotoSelecionada} style={imagemModal} />
        </div>
      )}
    </div>
  )
}

/* 🔹 COMPONENTE DE SEÇÃO */

function Secao({ titulo, fotos, onClick }: any) {
  return (
    <div style={card}>
      <h2 style={sectionTitle}>{titulo}</h2>

      {fotos.length === 0 ? (
        <p style={empty}>Nenhuma foto ainda</p>
      ) : (
        <div style={grid}>
          {fotos.map((foto: any) => (
            <img
              key={foto.id}
              src={foto.url}
              style={imagem}
              onClick={() => onClick(foto.url)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* 🎨 ESTILO PREMIUM */

const container = {
  minHeight: '100vh',
  padding: '30px',
  background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
}

const header = {
  marginBottom: '30px',
}

const titulo = {
  fontSize: '30px',
  color: '#0f172a',
}

const subtitulo = {
  color: '#64748b',
  marginTop: '5px',
}

const card = {
  background: '#fff',
  padding: '20px',
  borderRadius: '16px',
  marginBottom: '20px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
}

const sectionTitle = {
  marginBottom: '15px',
  color: '#0f172a',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '15px',
}

const imagem = {
  width: '100%',
  height: '200px',
  objectFit: 'cover' as const,
  borderRadius: '12px',
  cursor: 'pointer',
  transition: '0.3s',
}

const empty = {
  color: '#64748b',
}

const modal = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
}

const imagemModal = {
  maxWidth: '90%',
  maxHeight: '90%',
  borderRadius: '12px',
}