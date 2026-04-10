'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import { InputTelefone, InputCNPJ, InputCPF } from '@/components/InputFormatado'
import { InputTelefone, InputCNPJ, InputCPF } from '@/components/InputFormatado'

export default function PerfilEmpresa() {

  const { empresaId, loading: loadingEmpresa } = useEmpresa()

  const [loading,   setLoading]   = useState(true)
  const [salvando,  setSalvando]  = useState(false)
  const [salvo,     setSalvo]     = useState(false)

  // Dados básicos
  const [nome,          setNome]          = useState('')
  const [razaoSocial,   setRazaoSocial]   = useState('')
  const [cnpj,          setCnpj]          = useState('')
  const [telefone,      setTelefone]      = useState('')
  const [email,         setEmail]         = useState('')

  // Endereço
  const [endereco,      setEndereco]      = useState('')
  const [cidade,        setCidade]        = useState('')
  const [estado,        setEstado]        = useState('')

  // Responsável técnico
  const [respNome,      setRespNome]      = useState('')
  const [respDoc,       setRespDoc]       = useState('')
  const [respRegistro,  setRespRegistro]  = useState('')
  const [tipoRegistro,  setTipoRegistro]  = useState('CREA')

  useEffect(() => {
    if (!loadingEmpresa && empresaId) carregar()
  }, [empresaId, loadingEmpresa])

  async function carregar() {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .maybeSingle()

      if (error) throw error
      if (!data) return

      setNome(data.nome               || '')
      setRazaoSocial(data.razao_social || '')
      setCnpj(data.cnpj               || '')
      setTelefone(data.telefone        || '')
      setEmail(data.email             || '')
      setEndereco(data.endereco        || '')
      setCidade(data.cidade           || '')
      setEstado(data.estado           || '')
      setRespNome(data.responsavel_nome      || '')
      setRespDoc(data.responsavel_documento  || '')
      setRespRegistro(data.responsavel_registro || '')
      setTipoRegistro(data.tipo_registro     || 'CREA')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function salvar() {
    if (!empresaId) return
    setSalvando(true)
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          nome,
          razao_social:          razaoSocial,
          cnpj,
          telefone,
          email,
          endereco,
          cidade,
          estado,
          responsavel_nome:      respNome,
          responsavel_documento: respDoc,
          responsavel_registro:  respRegistro,
          tipo_registro:         tipoRegistro,
        })
        .eq('id', empresaId)

      if (error) throw error

      setSalvo(true)
      setTimeout(() => setSalvo(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar perfil')
    } finally {
      setSalvando(false)
    }
  }

  if (loadingEmpresa || loading) return <p style={{ padding: 24 }}>Carregando...</p>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={titulo}>🏢 Perfil da Empresa</h1>
        <p style={subtitulo}>
          Estas informações serão usadas automaticamente em contratos e documentos gerados pelo sistema.
        </p>
      </div>

      {salvo && (
        <div style={bannerSalvo}>
          ✅ Perfil salvo com sucesso!
        </div>
      )}

      {/* ── DADOS BÁSICOS ── */}
      <Secao titulo="Identificação da Empresa">
        <div style={formGrid2}>
          <Campo label="Nome Fantasia *">
            <input value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Ex: DudaBuild Construtora" style={input} />
          </Campo>
          <Campo label="Razão Social">
            <input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)}
              placeholder="Ex: DudaBuild Engenharia Ltda" style={input} />
          </Campo>
          <Campo label="CNPJ">
            <InputCNPJ value={cnpj} onChange={setCnpj} style={input} />
          </Campo>
          <Campo label="Telefone / WhatsApp">
            <InputTelefone value={telefone} onChange={setTelefone} style={input} />
          </Campo>
          <Campo label="E-mail" full>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="contato@empresa.com.br" style={input} />
          </Campo>
        </div>
      </Secao>

      {/* ── ENDEREÇO ── */}
      <Secao titulo="Endereço">
        <div style={formGrid2}>
          <Campo label="Endereço" full>
            <input value={endereco} onChange={e => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro" style={input} />
          </Campo>
          <Campo label="Cidade">
            <input value={cidade} onChange={e => setCidade(e.target.value)}
              placeholder="Ex: Joaçaba" style={input} />
          </Campo>
          <Campo label="Estado">
            <select value={estado} onChange={e => setEstado(e.target.value)} style={input}>
              <option value="">Selecione...</option>
              {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
                'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf =>
                <option key={uf} value={uf}>{uf}</option>
              )}
            </select>
          </Campo>
        </div>
      </Secao>

      {/* ── RESPONSÁVEL TÉCNICO ── */}
      <Secao titulo="Responsável Técnico" dica="Engenheiro ou arquiteto responsável pela empresa. Dados obrigatórios para emissão de contratos com ART/RRT.">
        <div style={formGrid2}>
          <Campo label="Nome do Responsável *" full>
            <input value={respNome} onChange={e => setRespNome(e.target.value)}
              placeholder="Ex: Eng. João da Silva" style={input} />
          </Campo>
          <Campo label="CPF do Responsável">
            <InputCPF value={respDoc} onChange={setRespDoc} style={input} />
          </Campo>
          <Campo label="Tipo de Registro">
            <select value={tipoRegistro} onChange={e => setTipoRegistro(e.target.value)} style={input}>
              <option value="CREA">CREA — Engenheiro</option>
              <option value="CAU">CAU — Arquiteto</option>
            </select>
          </Campo>
          <Campo label={`Número do ${tipoRegistro}`} full>
            <input value={respRegistro} onChange={e => setRespRegistro(e.target.value)}
              placeholder={tipoRegistro === 'CREA' ? 'Ex: CREA-SC 123456' : 'Ex: CAU A123456-7'}
              style={input} />
          </Campo>
        </div>

        {/* AVISO NORMAS */}
        <div style={avisoNormas}>
          <p style={{ fontWeight: 700, marginBottom: 6, color: '#1e40af' }}>📋 Exigências legais</p>
          <p style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 }}>
            A emissão da <strong>ART (Anotação de Responsabilidade Técnica)</strong> pelo CREA ou
            <strong> RRT (Registro de Responsabilidade Técnica)</strong> pelo CAU é obrigatória para
            execução de obras de construção civil (Lei 6.496/77). O número do registro é necessário
            para a geração do contrato conforme as normas ABNT NBR 15575 e NBR 6118.
          </p>
        </div>
      </Secao>

      {/* ── BOTÃO SALVAR ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={salvar} style={btnSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : '💾 Salvar Perfil'}
        </button>
      </div>

    </div>
  )
}

/* ── COMPONENTES ── */
function Secao({ titulo, dica, children }: any) {
  return (
    <div style={secaoCard}>
      <div style={{ marginBottom: 16 }}>
        <p style={secaoTitulo}>{titulo}</p>
        {dica && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{dica}</p>}
      </div>
      {children}
    </div>
  )
}

function Campo({ label, children, full }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: full ? '1 / -1' : undefined }}>
      <label style={labelSt}>{label}</label>
      {children}
    </div>
  )
}

/* ── ESTILOS ── */
const titulo: React.CSSProperties    = { fontSize: 24, fontWeight: 800, color: '#0f172a' }
const subtitulo: React.CSSProperties = { fontSize: 13, color: '#94a3b8', marginTop: 4 }
const secaoCard: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const secaoTitulo: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }
const formGrid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const labelSt: React.CSSProperties   = { fontSize: 12, fontWeight: 600, color: '#374151' }
const input: React.CSSProperties     = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#f8fafc', width: '100%', boxSizing: 'border-box' }
const btnSalvar: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }
const bannerSalvo: React.CSSProperties = { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontWeight: 600, color: '#15803d' }
const avisoNormas: React.CSSProperties = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', marginTop: 16 }