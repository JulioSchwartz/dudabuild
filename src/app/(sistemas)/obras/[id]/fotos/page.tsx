'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

const TIPOS = [
  { valor: 'fachada',    label: '🏠 Fachada' },
  { valor: 'interior',   label: '🛋️ Interior' },
  { valor: 'estrutura',  label: '🏗️ Estrutura' },
  { valor: 'acabamento', label: '🎨 Acabamento' },
  { valor: 'outros',     label: '📷 Outros' },
]

export default function FotosObra() {

  const { id }        = useParams()
  const router        = useRouter()
  const { empresaId, loading: loadingEmpresa } = useEmpresa()

  const [fotos,          setFotos]          = useState<any[]>([])
  const [tipo,           setTipo]           = useState('fachada')
  const [loading,        setLoading]        = useState(false)
  const [fotoSelecionada,setFotoSelecionada]= useState<string | null>(null)
  const [tipoAtivo,      setTipoAtivo]      = useState('todos')
  const [obraToken,      setObraToken]      = useState<string | null>(null)
  const [linkCopiado,    setLinkCopiado]    = useState(false)

  useEffect(() => {
    if (loadingEmpresa) return
    if (!empresaId)     return
    carregar()
  }, [empresaId, loadingEmpresa])

  async function carregar() {
    const [{ data: fotosData, error }, { data: obraData }] = await Promise.all([
      supabase.from('obra_fotos').select('*').eq('obra_id', Number(id)).eq('empresa_id', empresaId).order('created_at', { ascending: false }),
      supabase.from('obras').select('token_publico').eq('id', Number(id)).maybeSingle(),
    ])
    if (error) { console.error(error); return }
    setFotos(fotosData || [])
    setObraToken(obraData?.token_publico || null)
  }

  async function gerarLinkPublico() {
    const token = obraToken || crypto.randomUUID()
    if (!obraToken) {
      await supabase.from('obras').update({ token_publico: token }).eq('id', Number(id)).eq('empresa_id', empresaId)
      setObraToken(token)
    }
    const link = `${window.location.origin}/obra-publica/${id}?token=${token}`
    await navigator.clipboard.writeText(link)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 3000)
  }

  async function uploadImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !empresaId) return
    setLoading(true)
    const nomeLimpo   = file.name.replace(/\s+/g, '-').replace(/[^\w.-]/g, '')
    const nomeArquivo = `${id}/${Date.now()}-${nomeLimpo}`
    const { error: errUpload } = await supabase.storage
      .from('obras').upload(nomeArquivo, file, { upsert: true, contentType: file.type })
    if (errUpload) { alert('Erro ao enviar imagem: ' + errUpload.message); setLoading(false); return }
    const { data: urlData } = supabase.storage.from('obras').getPublicUrl(nomeArquivo)
    await supabase.from('obra_fotos').insert([{ obra_id: Number(id), empresa_id: empresaId, url: urlData.publicUrl, tipo }])
    e.target.value = ''
    setLoading(false)
    carregar()
  }

  async function excluirFoto(foto: any) {
    if (!confirm('Excluir esta foto?')) return
    try {
      const caminho = foto.url.split('/obras/')[1]
      await supabase.storage.from('obras').remove([caminho])
      await supabase.from('obra_fotos').delete().eq('id', foto.id)
      carregar()
    } catch (err) { alert('Erro ao excluir foto') }
  }

  if (loadingEmpresa) return <p style={{ padding: 24 }}>Carregando...</p>

  const fotosFiltradas = tipoAtivo === 'todos' ? fotos : fotos.filter(f => f.tipo === tipoAtivo)

  return (
    <div style={{ padding: 24 }}>

      <button onClick={() => router.back()} style={btnVoltar}>← Voltar para a Obra</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={titulo}>📸 Registro Fotográfico</h1>
          <p style={subtitulo}>{fotos.length} foto(s) registrada(s)</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button onClick={gerarLinkPublico} style={btnLinkPublico}>
            {linkCopiado ? '✅ Link copiado!' : '🔗 Gerar link para o cliente'}
          </button>
          {obraToken && (
            <a
              href={`/obra-publica/${id}?token=${obraToken}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: '#2563eb', textDecoration: 'underline' }}
            >
              Visualizar página do cliente →
            </a>
          )}
          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', maxWidth: 260 }}>
            O link dá acesso às fotos da obra E às fotos das etapas do cronograma
          </p>
        </div>
      </div>

      {/* UPLOAD */}
      <div style={uploadCard}>
        <h3 style={uploadTitulo}>➕ Adicionar Foto</h3>
        <div style={uploadRow}>
          <div style={formGrupo}>
            <label style={labelSt}>Categoria</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={selectSt}>
              {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
            </select>
          </div>
          <div style={formGrupo}>
            <label style={labelSt}>Arquivo</label>
            <input type="file" accept="image/*" onChange={uploadImagem} disabled={loading} style={inputFile} />
          </div>
          {loading && <p style={{ color: '#2563eb', alignSelf: 'flex-end', fontSize: 13 }}>⏳ Enviando...</p>}
        </div>
      </div>

      {/* FILTROS */}
      <div style={filtroTipos}>
        <button onClick={() => setTipoAtivo('todos')} style={tipoAtivo === 'todos' ? filtroAtivo : filtroInativo}>
          Todas ({fotos.length})
        </button>
        {TIPOS.map(t => {
          const qtd = fotos.filter(f => f.tipo === t.valor).length
          if (qtd === 0) return null
          return (
            <button key={t.valor} onClick={() => setTipoAtivo(t.valor)}
              style={tipoAtivo === t.valor ? filtroAtivo : filtroInativo}>
              {t.label} ({qtd})
            </button>
          )
        })}
      </div>

      {/* GALERIA */}
      {fotosFiltradas.length === 0
        ? (
          <div style={vazioCard}>
            <p style={{ fontSize: 40 }}>📷</p>
            <p style={{ fontWeight: 600, color: '#0f172a' }}>Nenhuma foto ainda</p>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Envie a primeira foto desta obra</p>
          </div>
        )
        : (
          <div style={grid}>
            {fotosFiltradas.map(foto => (
              <div key={foto.id} style={cardFoto}>
                <img src={foto.url} alt={foto.tipo} style={imgStyle} onClick={() => setFotoSelecionada(foto.url)} />
                <div style={fotoInfo}>
                  <span style={fotoTipo}>{TIPOS.find(t => t.valor === foto.tipo)?.label || foto.tipo}</span>
                  <span style={fotoData}>{new Date(foto.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <button style={btnExcluir} onClick={() => excluirFoto(foto)}>🗑</button>
              </div>
            ))}
          </div>
        )
      }

      {/* MODAL */}
      {fotoSelecionada && (
        <div style={modal} onClick={() => setFotoSelecionada(null)}>
          <div style={{ position: 'relative' }}>
            <img src={fotoSelecionada} style={imgModal} alt="Foto ampliada" />
            <button style={modalClose} onClick={() => setFotoSelecionada(null)}>✕</button>
          </div>
        </div>
      )}

    </div>
  )
}

const btnVoltar: React.CSSProperties     = { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 }
const titulo: React.CSSProperties        = { fontSize: 24, fontWeight: 800, color: '#0f172a' }
const subtitulo: React.CSSProperties     = { fontSize: 13, color: '#94a3b8', marginTop: 2 }
const btnLinkPublico: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }
const uploadCard: React.CSSProperties    = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const uploadTitulo: React.CSSProperties  = { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }
const uploadRow: React.CSSProperties     = { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }
const formGrupo: React.CSSProperties     = { display: 'flex', flexDirection: 'column', gap: 4 }
const labelSt: React.CSSProperties       = { fontSize: 12, fontWeight: 600, color: '#374151' }
const selectSt: React.CSSProperties      = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff', minWidth: 180 }
const inputFile: React.CSSProperties     = { fontSize: 13, cursor: 'pointer' }
const filtroTipos: React.CSSProperties   = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }
const filtroAtivo: React.CSSProperties   = { background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const filtroInativo: React.CSSProperties = { background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer' }
const grid: React.CSSProperties          = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }
const cardFoto: React.CSSProperties      = { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'relative' }
const imgStyle: React.CSSProperties      = { width: '100%', height: 180, objectFit: 'cover', cursor: 'pointer', display: 'block' }
const fotoInfo: React.CSSProperties      = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }
const fotoTipo: React.CSSProperties      = { fontSize: 12, fontWeight: 600, color: '#374151' }
const fotoData: React.CSSProperties      = { fontSize: 11, color: '#94a3b8' }
const btnExcluir: React.CSSProperties    = { position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 }
const vazioCard: React.CSSProperties     = { textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 14 }
const modal: React.CSSProperties         = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }
const imgModal: React.CSSProperties      = { maxWidth: '90vw', maxHeight: '88vh', borderRadius: 12, display: 'block' }
const modalClose: React.CSSProperties    = { position: 'absolute', top: -16, right: -16, background: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 16, cursor: 'pointer', fontWeight: 700 }