'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const CATEGORIAS_ENTRADA = [
  'Pagamento Inicial / Sinal', 'Parcela Cliente', 'Parcela Final',
  'Aditivo de Contrato', 'Medição Parcial', 'Outros (Entrada)',
]
const CATEGORIAS_SAIDA = [
  'Materiais de Construção', 'Mão de Obra', 'Aluguel de Equipamentos',
  'Transporte / Frete', 'Serviços Terceirizados', 'Taxas e Impostos',
  'Ferramentas', 'Energia Elétrica / Água', 'Segurança do Trabalho (EPI)',
  'Projeto / Engenharia', 'Outros (Saída)',
]

const CLIMA_OPCOES = ['☀️ Ensolarado', '⛅ Nublado', '🌧️ Chuvoso', '🌪️ Ventoso', '❄️ Frio']

export default function DetalheObra() {

  const { empresaId, loading: loadingEmpresa } = useEmpresa()
  const { id }   = useParams()
  const router   = useRouter()

  const [obra,        setObra]        = useState<any>(null)
  const [financeiro,  setFinanceiro]  = useState<any[]>([])
  const [diarios,     setDiarios]     = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form lançamento financeiro
  const [tipo,      setTipo]      = useState<'entrada' | 'saida'>('entrada')
  const [categoria, setCategoria] = useState('')
  const [valor,     setValor]     = useState('')
  const [data,      setData]      = useState(new Date().toISOString().split('T')[0])
  const [salvando,  setSalvando]  = useState(false)
  const [abaAtiva,  setAbaAtiva]  = useState<'entrada' | 'saida'>('entrada')

  // Form diário de obra
  const [diarioData,         setDiarioData]         = useState(new Date().toISOString().split('T')[0])
  const [diarioClima,        setDiarioClima]        = useState('☀️ Ensolarado')
  const [diarioFuncionarios, setDiarioFuncionarios] = useState('')
  const [diarioServicos,     setDiarioServicos]     = useState('')
  const [diarioProblemas,    setDiarioProblemas]    = useState('')
  const [diarioObservacoes,  setDiarioObservacoes]  = useState('')
  const [salvandoDiario,     setSalvandoDiario]     = useState(false)
  const [mostrarFormDiario,  setMostrarFormDiario]  = useState(false)
  const [diarioExpandido,    setDiarioExpandido]    = useState<string | null>(null)

  // Etapas da obra
  const [etapas,          setEtapas]          = useState<any[]>([])
  const [salvandoEtapa,   setSalvandoEtapa]   = useState<string | null>(null)
  const [novaEtapaNome,    setNovaEtapaNome]    = useState('')
  const [novaEtapaPeso,    setNovaEtapaPeso]    = useState('20')
  const [novaEtapaData,    setNovaEtapaData]    = useState('')
  const [novaEtapaInicio,  setNovaEtapaInicio]  = useState('')
  const [mostrarFormEtapa, setMostrarFormEtapa] = useState(false)
  const [adicionandoEtapa, setAdicionandoEtapa] = useState(false)

  // Medições por etapa
  const [medicoes,        setMedicoes]        = useState<Record<string, any[]>>({})
  const [etapaExpandida,  setEtapaExpandida]  = useState<string | null>(null)
  const [formMedicao,     setFormMedicao]     = useState<string | null>(null) // etapa_id com form aberto
  const [medData,         setMedData]         = useState(new Date().toISOString().split('T')[0])
  const [medDescricao,    setMedDescricao]    = useState('')
  const [medPercentual,   setMedPercentual]   = useState('')
  const [salvandoMedicao, setSalvandoMedicao] = useState(false)
  const [medFoto,         setMedFoto]         = useState<File | null>(null)
  const [medFotoPreview,  setMedFotoPreview]  = useState<string | null>(null)

  useEffect(() => {
    if (loadingEmpresa) return
    if (!empresaId) { router.push('/login'); return }
    if (!id) return
    carregar()
  }, [id, empresaId, loadingEmpresa])

  async function carregar() {
    try {
      setLoadingData(true)
      const [{ data: obraData }, { data: finData }, { data: diarioData }, { data: etapasData }, { data: medicoesData }] = await Promise.all([
        supabase.from('obras').select('*').eq('id', Number(id)).eq('empresa_id', empresaId).maybeSingle(),
        supabase.from('financeiro').select('*').eq('obra_id', Number(id)).eq('empresa_id', empresaId).order('created_at', { ascending: false }),
        supabase.from('diario_obra').select('*').eq('obra_id', Number(id)).eq('empresa_id', empresaId).order('data', { ascending: false }),
        supabase.from('obra_etapas').select('*').eq('obra_id', Number(id)).eq('empresa_id', empresaId).order('ordem', { ascending: true }),
        supabase.from('etapa_medicoes').select('*').eq('obra_id', Number(id)).eq('empresa_id', empresaId).order('data', { ascending: true }),
      ])
      setObra(obraData)
      setFinanceiro(finData || [])
      setDiarios(diarioData || [])
      setEtapas(etapasData || [])

      // Agrupa medições por etapa_id
      const medPorEtapa: Record<string, any[]> = {}
      ;(medicoesData || []).forEach((m: any) => {
        if (!medPorEtapa[m.etapa_id]) medPorEtapa[m.etapa_id] = []
        medPorEtapa[m.etapa_id].push(m)
      })
      setMedicoes(medPorEtapa)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingData(false)
    }
  }

  async function lancar() {
    if (!categoria)                   return alert('Selecione uma categoria')
    if (!valor || Number(valor) <= 0) return alert('Informe um valor válido')

    setSalvando(true)
    try {
      const { error } = await supabase.from('financeiro').insert({
        empresa_id: empresaId, obra_id: Number(id),
        tipo, descricao: categoria, valor: Number(valor),
        created_at: `${data}T12:00:00-03:00`,
      })
      if (error) throw error
      setCategoria(''); setValor('')
      setData(new Date().toISOString().split('T')[0])
      await carregar()
    } catch (err) {
      alert('Erro ao salvar lançamento')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarDiario() {
    if (!diarioServicos.trim()) return alert('Descreva os serviços executados')

    setSalvandoDiario(true)
    try {
      const { error } = await supabase.from('diario_obra').insert({
        obra_id:      Number(id),
        empresa_id:   empresaId,
        data:         diarioData,
        clima:        diarioClima,
        funcionarios: diarioFuncionarios ? Number(diarioFuncionarios) : null,
        servicos:     diarioServicos.trim(),
        problemas:    diarioProblemas.trim() || null,
        observacoes:  diarioObservacoes.trim() || null,
      })
      if (error) throw error

      // Limpa form
      setDiarioServicos('')
      setDiarioProblemas('')
      setDiarioObservacoes('')
      setDiarioFuncionarios('')
      setDiarioData(new Date().toISOString().split('T')[0])
      setMostrarFormDiario(false)
      await carregar()
    } catch (err) {
      alert('Erro ao salvar diário')
    } finally {
      setSalvandoDiario(false)
    }
  }

  async function excluirDiario(diarioId: string) {
    if (!confirm('Excluir este registro do diário?')) return
    await supabase.from('diario_obra').delete().eq('id', diarioId)
    carregar()
  }

  async function excluir(lancId: string) {
    if (!confirm('Excluir este lançamento?')) return
    await supabase.from('financeiro').delete().eq('id', lancId)
    carregar()
  }

  async function adicionarEtapa() {
    if (!novaEtapaNome.trim()) return alert('Informe o nome da etapa')
    setAdicionandoEtapa(true)
    try {
      const { error } = await supabase.from('obra_etapas').insert({
        obra_id:       Number(id),
        empresa_id:    empresaId,
        nome:          novaEtapaNome.trim(),
        peso:          Number(novaEtapaPeso || 20),
        percentual:    0,
        data_prevista: novaEtapaData   || null,
        data_inicio:   novaEtapaInicio || null,
        status:        'aguardando',
        ordem:         etapas.length,
      })
      if (error) throw error
      setNovaEtapaNome('')
      setNovaEtapaPeso('20')
      setNovaEtapaData('')
      setNovaEtapaInicio('')
      setMostrarFormEtapa(false)
      await carregar()
    } catch (err) {
      alert('Erro ao adicionar etapa')
    } finally {
      setAdicionandoEtapa(false)
    }
  }

  async function atualizarEtapa(etapaId: string, campo: string, valor: any) {
    await supabase.from('obra_etapas').update({ [campo]: valor }).eq('id', etapaId)
    await carregar()
    await recalcularProgresso()
  }

  async function excluirEtapa(etapaId: string) {
    if (!confirm('Excluir esta etapa e todas as suas medições?')) return
    await supabase.from('etapa_medicoes').delete().eq('etapa_id', etapaId)
    await supabase.from('obra_etapas').delete().eq('id', etapaId)
    await carregar()
    await recalcularProgresso()
  }

  async function adicionarMedicao(etapaId: string) {
    if (!medPercentual || Number(medPercentual) <= 0) return alert('Informe o % desta medição')

    // Verifica se não vai ultrapassar 100%
    const medEtapa = medicoes[etapaId] || []
    const totalAtual = medEtapa.reduce((a: number, m: any) => a + Number(m.percentual), 0)
    if (totalAtual + Number(medPercentual) > 100) {
      return alert(`Essa medição ultrapassaria 100%. A etapa já tem ${totalAtual}% registrado.`)
    }

    setSalvandoMedicao(true)
    try {
      // Upload da foto se existir
      let fotoUrl: string | null = null
      if (medFoto) {
        const nomeLimpo   = medFoto.name.replace(/\s+/g, '-').replace(/[^\w.-]/g, '')
        const nomeArquivo = `${id}/${etapaId}/${Date.now()}-${nomeLimpo}`
        const { error: errUpload } = await supabase.storage
          .from('medicoes')
          .upload(nomeArquivo, medFoto, { upsert: true, contentType: medFoto.type })
        if (!errUpload) {
          const { data: urlData } = supabase.storage.from('medicoes').getPublicUrl(nomeArquivo)
          fotoUrl = urlData.publicUrl
        }
      }

      const { error } = await supabase.from('etapa_medicoes').insert({
        etapa_id:   etapaId,
        obra_id:    Number(id),
        empresa_id: empresaId,
        data:       medData,
        descricao:  medDescricao.trim() || null,
        percentual: Number(medPercentual),
        foto_url:   fotoUrl,
      })
      if (error) throw error

      // Recalcula % da etapa somando medições
      const novoTotal = totalAtual + Number(medPercentual)
      const novoStatus = novoTotal >= 100 ? 'concluida'
        : novoTotal > 0 ? 'em_andamento' : 'aguardando'
      const updates: any = { percentual: Math.min(novoTotal, 100), status: novoStatus }
      if (novoStatus === 'concluida') updates.data_conclusao = medData
      await supabase.from('obra_etapas').update(updates).eq('id', etapaId)

      setMedDescricao('')
      setMedPercentual('')
      setMedData(new Date().toISOString().split('T')[0])
      setMedFoto(null)
      setMedFotoPreview(null)
      setFormMedicao(null)
      await carregar()
      await recalcularProgresso()
    } catch (err) {
      alert('Erro ao salvar medição')
    } finally {
      setSalvandoMedicao(false)
    }
  }

  async function excluirMedicao(medicaoId: string, etapaId: string) {
    if (!confirm('Excluir esta medição?')) return
    await supabase.from('etapa_medicoes').delete().eq('id', medicaoId)
    // Recalcula % da etapa
    const { data: meds } = await supabase.from('etapa_medicoes').select('percentual').eq('etapa_id', etapaId)
    const novoTotal = (meds || []).reduce((a: number, m: any) => a + Number(m.percentual), 0)
    const novoStatus = novoTotal >= 100 ? 'concluida' : novoTotal > 0 ? 'em_andamento' : 'aguardando'
    await supabase.from('obra_etapas').update({ percentual: novoTotal, status: novoStatus, data_conclusao: novoTotal >= 100 ? new Date().toISOString().split('T')[0] : null }).eq('id', etapaId)
    await carregar()
    await recalcularProgresso()
  }

  async function recalcularProgresso() {
    const { data } = await supabase.from('obra_etapas').select('peso, percentual').eq('obra_id', Number(id)).eq('empresa_id', empresaId)
    if (!data || data.length === 0) return
    const totalPeso = data.reduce((a: number, e: any) => a + Number(e.peso || 0), 0)
    if (totalPeso === 0) return
    const percGlobal = data.reduce((a: number, e: any) => a + (Number(e.percentual || 0) * Number(e.peso || 0) / totalPeso), 0)
    const novoPerc = Math.round(percGlobal)
    await supabase.from('obras').update({ percentual_concluido: novoPerc }).eq('id', Number(id))
    // ✅ Atualiza o estado local da obra para refletir imediatamente no card de progresso
    setObra((prev: any) => prev ? { ...prev, percentual_concluido: novoPerc } : prev)
  }

  if (loadingEmpresa || loadingData) return <p style={{ padding: 24 }}>Carregando...</p>
  if (!obra) return <p style={{ padding: 24 }}>Obra não encontrada.</p>

  /* ── MÉTRICAS FINANCEIRAS ── */
  const entradas      = financeiro.filter(f => f.tipo === 'entrada')
  const saidas        = financeiro.filter(f => f.tipo === 'saida')
  const totalEntradas = entradas.reduce((a, e) => a + Number(e.valor), 0)
  const totalSaidas   = saidas.reduce((a, s)   => a + Number(s.valor), 0)
  const lucro         = totalEntradas - totalSaidas
  const margem        = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0
  const valorContrato = obra.valor || 0
  const orcCusto      = obra.orcamento_custo || 0
  const restReceber   = valorContrato - totalEntradas
  const lucroPrevisto = valorContrato - totalSaidas
  const custoPorMetro = obra.area && obra.area > 0 ? totalSaidas / obra.area : 0

  const percOrcado      = orcCusto > 0 ? (totalSaidas / orcCusto) * 100 : 0
  const alertaOrcamento = orcCusto > 0 && percOrcado > 90

  const perc          = Number(obra.percentual_concluido || 0)
  const hoje          = new Date()
  const dataInicio    = obra.data_inicio   ? new Date(obra.data_inicio)   : null
  const dataPrevisao  = obra.data_previsao ? new Date(obra.data_previsao) : null
  const diasRestantes = dataPrevisao
    ? Math.ceil((dataPrevisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const atrasada     = diasRestantes !== null && diasRestantes < 0 && perc < 100
  const corProgresso = perc < 30 ? '#ef4444' : perc < 70 ? '#f59e0b' : '#22c55e'

  const fluxoMensal: Record<string, { mes: string; entrada: number; saida: number }> = {}
  financeiro.forEach(item => {
    const mes = new Date(item.created_at).toLocaleDateString('pt-BR', { month: 'short' })
    if (!fluxoMensal[mes]) fluxoMensal[mes] = { mes, entrada: 0, saida: 0 }
    if (item.tipo === 'entrada') fluxoMensal[mes].entrada += Number(item.valor)
    else                         fluxoMensal[mes].saida   += Number(item.valor)
  })
  const dadosGrafico = Object.values(fluxoMensal)

  const resumoCategoria: Record<string, number> = {}
  saidas.forEach(s => { resumoCategoria[s.descricao] = (resumoCategoria[s.descricao] || 0) + Number(s.valor) })
  const rankingCategorias = Object.entries(resumoCategoria)
    .map(([k, v]) => ({ nome: k, valor: v, perc: totalSaidas > 0 ? (v / totalSaidas) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)

  const categorias    = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA
  const listaFiltrada = financeiro.filter(f => f.tipo === abaAtiva)

  return (
    <div style={{ padding: 24 }}>

      {/* ALERTAS */}
      {lucro < 0      && <Alerta cor="#fee2e2" borda="#fca5a5" texto="🚨 Obra em prejuízo — revise os custos imediatamente" />}
      {atrasada       && <Alerta cor="#fef3c7" borda="#fcd34d" texto={`⏰ Obra atrasada — prazo venceu há ${Math.abs(diasRestantes!)} dias`} />}
      {alertaOrcamento && <Alerta cor="#fff7ed" borda="#fdba74" texto={`⚠️ Custo atingiu ${percOrcado.toFixed(0)}% do orçamento previsto`} />}

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <button onClick={() => router.back()} style={btnVoltar}>← Voltar</button>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>{obra.nome}</h1>
          <p style={{ color: '#64748b' }}>{obra.cliente}{obra.endereco ? ` · ${obra.endereco}` : ''}</p>
          <p style={{ color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
            Contrato: {format(valorContrato)}
            {orcCusto > 0 && <span style={{ color: '#64748b', fontWeight: 400 }}> · Orçamento de custo: {format(orcCusto)}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push(`/obras/${id}/fotos`)}    style={btnFotos}>📸 Fotos</button>
          <button onClick={() => router.push(`/obras/${id}/contrato`)} style={btnContrato}>📄 Contrato</button>
          <button onClick={() => router.push(`/obras/${id}/editar`)}   style={btnEditar}>✏️ Editar</button>
        </div>
      </div>

      {/* PROGRESSO */}
      <div style={progressoCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>📐 Progresso da Obra</p>
            {dataInicio   && <p style={{ fontSize: 12, color: '#64748b' }}>Início: {new Date(dataInicio).toLocaleDateString('pt-BR')}</p>}
            {dataPrevisao && <p style={{ fontSize: 12, color: diasRestantes! < 0 ? '#dc2626' : '#64748b' }}>
              {diasRestantes! >= 0
                ? `${diasRestantes} dias restantes`
                : `${Math.abs(diasRestantes!)} dias de atraso`}
              {' '}(previsto: {dataPrevisao.toLocaleDateString('pt-BR')})
            </p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 32, fontWeight: 900, color: corProgresso }}>{perc}%</p>
            <p style={{ fontSize: 12, color: '#64748b' }}>concluído</p>
          </div>
        </div>
        <div style={{ height: 14, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${perc}%`, background: corProgresso, borderRadius: 999, transition: 'width 0.3s' }} />
        </div>
        {orcCusto > 0 && (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              Orçado vs Realizado: {format(totalSaidas)} de {format(orcCusto)} ({percOrcado.toFixed(1)}%)
            </p>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(percOrcado, 100)}%`, background: percOrcado > 90 ? '#ef4444' : '#3b82f6', borderRadius: 999 }} />
            </div>
          </div>
        )}
      </div>

      {/* ── CRONOGRAMA FÍSICO ── */}
      <div style={graficoBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>📋 Cronograma Físico</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Medições por etapa · % global calculado automaticamente pela média ponderada
            </p>
          </div>
          <button onClick={() => setMostrarFormEtapa(!mostrarFormEtapa)} style={btnNovoDiario}>
            {mostrarFormEtapa ? '✕ Cancelar' : '+ Nova Etapa'}
          </button>
        </div>

        {/* FORM NOVA ETAPA */}
        {mostrarFormEtapa && (
          <div style={{ ...formDiario, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
              <div style={formGrupoD}>
                <label style={labelSt}>Nome da Etapa *</label>
                <input value={novaEtapaNome} onChange={e => setNovaEtapaNome(e.target.value)}
                  placeholder="Ex: Fundação, Estrutura..." style={inputSt} />
              </div>
              <div style={formGrupoD}>
                <label style={labelSt}>Peso (%)</label>
                <input type="number" value={novaEtapaPeso} onChange={e => setNovaEtapaPeso(e.target.value)}
                  placeholder="20" style={inputSt} min="1" max="100" />
              </div>
              <div style={formGrupoD}>
                <label style={labelSt}>Data Início</label>
                <input type="date" value={novaEtapaInicio} onChange={e => setNovaEtapaInicio(e.target.value)} style={inputSt} />
              </div>
              <div style={formGrupoD}>
                <label style={labelSt}>Previsão Término</label>
                <input type="date" value={novaEtapaData} onChange={e => setNovaEtapaData(e.target.value)} style={inputSt} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>
              O peso define quanto esta etapa contribui para o % global da obra.
              Ex: Fundação=15, Estrutura=25, Cobertura=15, Instalações=20, Acabamento=25
            </p>
            <button onClick={adicionarEtapa} disabled={adicionandoEtapa} style={btnSalvarDiario}>
              {adicionandoEtapa ? 'Adicionando...' : '+ Adicionar Etapa'}
            </button>
          </div>
        )}

        {/* SUGESTÕES RÁPIDAS */}
        {etapas.length === 0 && !mostrarFormEtapa && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>💡 Sugestões rápidas:</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { nome: 'Fundação',    peso: 15 },
                { nome: 'Estrutura',   peso: 25 },
                { nome: 'Cobertura',   peso: 15 },
                { nome: 'Instalações', peso: 20 },
                { nome: 'Acabamento',  peso: 25 },
              ].map(s => (
                <button key={s.nome} style={btnSugestao}
                  onClick={async () => {
                    await supabase.from('obra_etapas').insert({
                      obra_id: Number(id), empresa_id: empresaId,
                      nome: s.nome, peso: s.peso, percentual: 0,
                      status: 'aguardando', ordem: etapas.length
                    })
                    await carregar()
                  }}
                >
                  + {s.nome} ({s.peso}%)
                </button>
              ))}
              <button style={{ ...btnSugestao, background: '#f0fdf4', color: '#16a34a', border: '1px dashed #86efac' }}
                onClick={async () => {
                  const etapasPadrao = [
                    { nome: 'Fundação', peso: 15 }, { nome: 'Estrutura', peso: 25 },
                    { nome: 'Cobertura', peso: 15 }, { nome: 'Instalações', peso: 20 }, { nome: 'Acabamento', peso: 25 }
                  ]
                  for (let i = 0; i < etapasPadrao.length; i++) {
                    await supabase.from('obra_etapas').insert({
                      obra_id: Number(id), empresa_id: empresaId,
                      nome: etapasPadrao[i].nome, peso: etapasPadrao[i].peso,
                      percentual: 0, status: 'aguardando', ordem: i
                    })
                  }
                  await carregar()
                }}
              >
                ✨ Adicionar todas
              </button>
            </div>
          </div>
        )}

        {/* LISTA DE ETAPAS */}
        {etapas.length === 0 && !mostrarFormEtapa && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '12px 0', fontSize: 13 }}>
            Nenhuma etapa cadastrada. Use as sugestões acima ou crie etapas personalizadas.
          </p>
        )}

        {etapas.map((etapa) => {
          const corStatus = etapa.status === 'concluida' ? '#16a34a'
            : etapa.status === 'em_andamento' ? '#f59e0b'
            : etapa.status === 'atrasada' ? '#dc2626' : '#94a3b8'
          const hoje2 = new Date()
          const prevista = etapa.data_prevista ? new Date(etapa.data_prevista + 'T12:00:00') : null
          const atrasadaEtapa = prevista && prevista < hoje2 && etapa.percentual < 100
          const medEtapa = medicoes[etapa.id] || []
          const totalMed = medEtapa.reduce((a: number, m: any) => a + Number(m.percentual), 0)
          const expandida = etapaExpandida === etapa.id

          return (
            <div key={etapa.id} style={{ ...diarioItem, borderLeft: `4px solid ${corStatus}`, marginBottom: 12 }}>

              {/* CABEÇALHO DA ETAPA */}
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                onClick={() => setEtapaExpandida(expandida ? null : etapa.id)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{etapa.nome}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: corStatus + '20', color: corStatus }}>
                      {etapa.status === 'concluida' ? '✅ Concluída'
                        : etapa.status === 'em_andamento' ? '🔄 Em andamento'
                        : atrasadaEtapa ? '⚠️ Atrasada' : '⏳ Aguardando'}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Peso: {etapa.peso}%</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{medEtapa.length} medição(ões)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12, color: '#64748b' }}>
                    {etapa.data_inicio && <span>Início: {new Date(etapa.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                    {etapa.data_prevista && (
                      <span style={{ color: atrasadaEtapa ? '#dc2626' : '#64748b' }}>
                        {atrasadaEtapa ? '⚠️ ' : ''}Previsto: {new Date(etapa.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {etapa.data_conclusao && <span style={{ color: '#16a34a' }}>✅ Concluído: {new Date(etapa.data_conclusao + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: corStatus }}>{etapa.percentual}%</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{expandida ? '▲' : '▼'}</span>
                  <button onClick={e => { e.stopPropagation(); excluirEtapa(etapa.id) }}
                    style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              </div>

              {/* BARRA DE PROGRESSO */}
              <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${etapa.percentual}%`, background: corStatus, borderRadius: 999, transition: 'width 0.3s' }} />
              </div>

              {/* EXPANDIDO — MEDIÇÕES */}
              {expandida && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>

                  {/* DATAS DA ETAPA */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Data de Início</label>
                      <input type="date" value={etapa.data_inicio || ''}
                        onChange={e => atualizarEtapa(etapa.id, 'data_inicio', e.target.value || null)}
                        style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Previsão de Término</label>
                      <input type="date" value={etapa.data_prevista || ''}
                        onChange={e => atualizarEtapa(etapa.id, 'data_prevista', e.target.value || null)}
                        style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', width: '100%' }} />
                    </div>
                  </div>

                  {/* LISTA DE MEDIÇÕES */}
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                    Medições ({medEtapa.length}) · Total: {totalMed}% de 100%
                  </p>

                  {medEtapa.length === 0 && (
                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Nenhuma medição lançada ainda.</p>
                  )}

                  {medEtapa.map((m: any) => (
                    <div key={m.id} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          {m.descricao && <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{m.descricao}</p>}
                          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: m.descricao ? 2 : 0 }}>
                            {new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>+{m.percentual}%</span>
                          {m.foto_url && (
                            <a href={m.foto_url} target="_blank" rel="noreferrer"
                              style={{ fontSize: 18, textDecoration: 'none' }} title="Ver foto">📷</a>
                          )}
                          <button onClick={() => excluirMedicao(m.id, etapa.id)}
                            style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 14 }}>✕</button>
                        </div>
                      </div>
                      {m.foto_url && (
                        <a href={m.foto_url} target="_blank" rel="noreferrer">
                          <img src={m.foto_url} alt="foto medição"
                            style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 6, marginTop: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }} />
                        </a>
                      )}
                    </div>
                  ))}

                  {/* FORM NOVA MEDIÇÃO */}
                  {formMedicao === etapa.id
                    ? (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14, marginTop: 8 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 10 }}>
                          Nova Medição · Disponível: {100 - totalMed}%
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 4 }}>Data *</label>
                            <input type="date" value={medData} onChange={e => setMedData(e.target.value)}
                              style={{ fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', width: '100%' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 4 }}>% desta medição *</label>
                            <input type="number" value={medPercentual} onChange={e => setMedPercentual(e.target.value)}
                              placeholder={`Máx: ${100 - totalMed}%`}
                              min="1" max={100 - totalMed} step="1"
                              style={{ fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', width: '100%' }} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                              Descrição do serviço <span style={{ color: '#94a3b8' }}>(opcional)</span>
                            </label>
                            <input value={medDescricao} onChange={e => setMedDescricao(e.target.value)}
                              placeholder="Ex: Escavação das sapatas concluída"
                              style={{ fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', width: '100%' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                              📷 Foto do serviço <span style={{ color: '#94a3b8' }}>(opcional)</span>
                            </label>
                            <input
                              type="file" accept="image/*"
                              onChange={e => {
                                const file = e.target.files?.[0] || null
                                setMedFoto(file)
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = ev => setMedFotoPreview(ev.target?.result as string)
                                  reader.readAsDataURL(file)
                                } else {
                                  setMedFotoPreview(null)
                                }
                              }}
                              style={{ fontSize: 12, cursor: 'pointer', width: '100%' }}
                            />
                            {medFotoPreview && (
                              <div style={{ marginTop: 6, position: 'relative', display: 'inline-block' }}>
                                <img src={medFotoPreview} alt="preview"
                                  style={{ width: '100%', maxHeight: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
                                <button
                                  onClick={() => { setMedFoto(null); setMedFotoPreview(null) }}
                                  style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, padding: '1px 5px' }}
                                >✕</button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => adicionarMedicao(etapa.id)} disabled={salvandoMedicao}
                            style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                            {salvandoMedicao ? 'Salvando...' : '✓ Registrar Medição'}
                          </button>
                          <button onClick={() => { setFormMedicao(null); setMedDescricao(''); setMedPercentual(''); setMedFoto(null); setMedFotoPreview(null) }}
                            style={{ background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )
                    : totalMed < 100 && (
                      <button onClick={() => { setFormMedicao(etapa.id); setMedDescricao(''); setMedPercentual('') }}
                        style={{ background: '#f0fdf4', color: '#16a34a', border: '1px dashed #86efac', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 8 }}>
                        + Lançar Medição ({100 - totalMed}% disponível)
                      </button>
                    )
                  }
                </div>
              )}
            </div>
          )
        })}

        {/* TOTAL PESOS */}
        {etapas.length > 0 && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>
              Total de pesos: <strong>{etapas.reduce((a, e) => a + Number(e.peso), 0)}%</strong>
              {etapas.reduce((a, e) => a + Number(e.peso), 0) !== 100 && (
                <span style={{ color: '#f59e0b', marginLeft: 8 }}>⚠️ Idealmente deve somar 100%</span>
              )}
            </span>
            <span style={{ color: '#0f172a', fontWeight: 700 }}>
              % Global calculado: {Math.round(etapas.reduce((a, e) => {
                const totalPeso = etapas.reduce((s, x) => s + Number(x.peso), 0)
                return totalPeso > 0 ? a + (Number(e.percentual) * Number(e.peso) / totalPeso) : a
              }, 0))}%
            </span>
          </div>
        )}
      </div>

      {/* CARDS FINANCEIROS */}
      <div style={grid}>
        <Card titulo="Receita"        valor={totalEntradas}   cor="#22c55e" />
        <Card titulo="Custos"         valor={totalSaidas}     cor="#ef4444" />
        <Card titulo="Lucro"          valor={lucro}           cor="#3b82f6" />
        <Card titulo="Margem"         valor={margem}          cor="#a855f7" tipo="porcentagem" />
        <Card titulo="A Receber"      valor={restReceber}     cor="#f59e0b" />
        <Card titulo="Lucro Previsto" valor={lucroPrevisto}   cor="#10b981" />
        {custoPorMetro > 0 && <Card titulo="Custo/m²" valor={custoPorMetro} cor="#f97316" />}
      </div>

      {/* GRÁFICO */}
      {dadosGrafico.length > 0 && (
        <div style={graficoBox}>
          <h3 style={{ marginBottom: 12 }}>📈 Fluxo Financeiro da Obra</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dadosGrafico}>
              <XAxis dataKey="mes" /><YAxis /><Tooltip /><Legend />
              <Line type="monotone" dataKey="entrada" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="saida"   stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── DIÁRIO DE OBRA ── */}
      <div style={graficoBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>📓 Diário de Obra</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {diarios.length} registro(s) · obrigatório por norma técnica (NBR)
            </p>
          </div>
          <button
            onClick={() => setMostrarFormDiario(!mostrarFormDiario)}
            style={btnNovoDiario}
          >
            {mostrarFormDiario ? '✕ Cancelar' : '+ Novo Registro'}
          </button>
        </div>

        {/* FORMULÁRIO DIÁRIO */}
        {mostrarFormDiario && (
          <div style={formDiario}>
            <div style={diarioGrid}>
              <div style={formGrupoD}>
                <label style={labelSt}>Data *</label>
                <input type="date" value={diarioData}
                  onChange={e => setDiarioData(e.target.value)} style={inputSt} />
              </div>
              <div style={formGrupoD}>
                <label style={labelSt}>Clima</label>
                <select value={diarioClima} onChange={e => setDiarioClima(e.target.value)} style={inputSt}>
                  {CLIMA_OPCOES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={formGrupoD}>
                <label style={labelSt}>Nº de Funcionários</label>
                <input type="number" value={diarioFuncionarios}
                  onChange={e => setDiarioFuncionarios(e.target.value)}
                  placeholder="Ex: 8" style={inputSt} min="0" />
              </div>
            </div>

            <div style={formGrupoD}>
              <label style={labelSt}>Serviços Executados *</label>
              <textarea
                value={diarioServicos}
                onChange={e => setDiarioServicos(e.target.value)}
                placeholder="Descreva os serviços realizados no dia..."
                style={textareaSt}
                rows={3}
              />
            </div>

            <div style={formGrupoD}>
              <label style={labelSt}>Problemas / Ocorrências</label>
              <textarea
                value={diarioProblemas}
                onChange={e => setDiarioProblemas(e.target.value)}
                placeholder="Registre problemas, imprevistos ou ocorrências..."
                style={textareaSt}
                rows={2}
              />
            </div>

            <div style={formGrupoD}>
              <label style={labelSt}>Observações Gerais</label>
              <textarea
                value={diarioObservacoes}
                onChange={e => setDiarioObservacoes(e.target.value)}
                placeholder="Material recebido, visitas, decisões tomadas..."
                style={textareaSt}
                rows={2}
              />
            </div>

            <button
              onClick={salvarDiario}
              style={btnSalvarDiario}
              disabled={salvandoDiario}
            >
              {salvandoDiario ? 'Salvando...' : '📓 Salvar Registro'}
            </button>
          </div>
        )}

        {/* LISTA DIÁRIOS */}
        {diarios.length === 0 && !mostrarFormDiario && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>
            Nenhum registro ainda. Clique em "+ Novo Registro" para começar.
          </p>
        )}

        {diarios.map(d => (
          <div key={d.id} style={diarioItem}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setDiarioExpandido(diarioExpandido === d.id ? null : d.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={diarioDataBadge}>
                  <p style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                    {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit' })}
                  </p>
                  <p style={{ fontSize: 10, color: '#64748b' }}>
                    {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                  </p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                    {d.clima}
                    {d.funcionarios ? ` · ${d.funcionarios} funcionários` : ''}
                  </p>
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    {d.servicos.length > 60 ? d.servicos.substring(0, 60) + '...' : d.servicos}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {d.problemas && (
                  <span style={badgeProblema}>⚠️ Ocorrência</span>
                )}
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  {diarioExpandido === d.id ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* EXPANDIDO */}
            {diarioExpandido === d.id && (
              <div style={diarioExpandidoBox}>
                <DiarioSecao titulo="Serviços Executados" conteudo={d.servicos} />
                {d.problemas    && <DiarioSecao titulo="Problemas / Ocorrências" conteudo={d.problemas} cor="#dc2626" />}
                {d.observacoes  && <DiarioSecao titulo="Observações" conteudo={d.observacoes} />}
                <button onClick={() => excluirDiario(d.id)} style={btnExcluirDiario}>
                  🗑 Excluir registro
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FORMULÁRIO LANÇAMENTO */}
      <div style={formCard}>
        <h3 style={formTitulo}>➕ Novo Lançamento</h3>
        <div style={tipoToggle}>
          <button onClick={() => { setTipo('entrada'); setCategoria('') }} style={tipo === 'entrada' ? btnTipoAtivo('#16a34a') : btnTipoInativo}>↑ Entrada</button>
          <button onClick={() => { setTipo('saida');   setCategoria('') }} style={tipo === 'saida'   ? btnTipoAtivo('#dc2626') : btnTipoInativo}>↓ Saída</button>
        </div>
        <div style={formRow}>
          <div style={formGrupo}>
            <label style={labelSt}>Categoria *</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={selectSt}>
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={formGrupo}>
            <label style={labelSt}>Valor (R$) *</label>
            <input type="number" value={valor} onChange={e => setValor(e.target.value)}
              placeholder="0,00" style={inputSt} min="0" step="0.01" />
          </div>
          <div style={formGrupo}>
            <label style={labelSt}>Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputSt} />
          </div>
        </div>
        <button onClick={lancar} style={btnLancar(tipo)} disabled={salvando}>
          {salvando ? 'Salvando...' : tipo === 'entrada' ? '↑ Registrar Entrada' : '↓ Registrar Saída'}
        </button>
      </div>

      {/* LISTA LANÇAMENTOS */}
      <div style={listaCard}>
        <div style={abaRow}>
          <button onClick={() => setAbaAtiva('entrada')} style={abaAtiva === 'entrada' ? abaAtivaStyle('#16a34a') : abaInativa}>Entradas ({entradas.length})</button>
          <button onClick={() => setAbaAtiva('saida')}   style={abaAtiva === 'saida'   ? abaAtivaStyle('#dc2626') : abaInativa}>Saídas ({saidas.length})</button>
        </div>
        {listaFiltrada.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>Nenhum lançamento ainda.</p>}
        {listaFiltrada.map(d => (
          <div key={d.id} style={itemLinha(d.tipo)}>
            <div>
              <p style={{ fontWeight: 600, color: '#0f172a' }}>{d.descricao}</p>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{new Date(d.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <strong style={{ color: d.tipo === 'entrada' ? '#16a34a' : '#dc2626', fontSize: 15 }}>
                {d.tipo === 'entrada' ? '+' : '-'} {format(Number(d.valor))}
              </strong>
              <button onClick={() => excluir(d.id)} style={btnExcluir}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* RANKING CUSTOS */}
      {rankingCategorias.length > 0 && (
        <div style={{ ...graficoBox, marginTop: 20 }}>
          <h3 style={{ marginBottom: 14 }}>💸 Breakdown de Custos</h3>
          {rankingCategorias.map((c, i) => (
            <div key={c.nome} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>#{i+1} {c.nome}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{format(c.valor)} · {c.perc.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999 }}>
                <div style={{ height: '100%', width: `${c.perc}%`, background: '#ef4444', borderRadius: 999, opacity: 0.7 + (i * 0.05) }} />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

/* ── HELPERS ── */
function format(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{ background: cor + '15', padding: 16, borderRadius: 12, border: `1px solid ${cor}40` }}>
      <p style={{ color: '#64748b', fontSize: 12 }}>{titulo}</p>
      <h2 style={{ color: cor, fontSize: 18, fontWeight: 800, marginTop: 4 }}>
        {tipo === 'porcentagem' ? Number(valor).toFixed(2) + '%' : format(valor)}
      </h2>
    </div>
  )
}

function Alerta({ cor, borda, texto }: any) {
  return <div style={{ background: cor, border: `1px solid ${borda}`, borderRadius: 10, padding: '12px 16px', marginBottom: 10, fontWeight: 600, fontSize: 14 }}>{texto}</div>
}

function DiarioSecao({ titulo, conteudo, cor }: any) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: cor || '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{titulo}</p>
      <p style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{conteudo}</p>
    </div>
  )
}

/* ── ESTILOS ── */
const btnVoltar: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 14, padding: 0 }
const btnFotos: React.CSSProperties  = { background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }
const btnContrato: React.CSSProperties = { background: '#0f172a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }
const btnEditar: React.CSSProperties = { background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }
const grid: React.CSSProperties      = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }
const graficoBox: React.CSSProperties   = { background: '#fff', padding: 20, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const progressoCard: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const formCard: React.CSSProperties  = { background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 20 }
const formTitulo: React.CSSProperties = { fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#0f172a' }
const tipoToggle: React.CSSProperties = { display: 'flex', gap: 10, marginBottom: 18 }
const formRow: React.CSSProperties   = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 16 }
const formGrupo: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const labelSt: React.CSSProperties   = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }
const inputSt: React.CSSProperties   = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }
const selectSt: React.CSSProperties  = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#fff' }
const btnTipoAtivo = (cor: string): React.CSSProperties => ({ flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${cor}`, background: cor, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 })
const btnTipoInativo: React.CSSProperties = { flex: 1, padding: '10px 0', borderRadius: 8, border: '2px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }
const btnLancar = (tipo: string): React.CSSProperties => ({ background: tipo === 'entrada' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' })
const listaCard: React.CSSProperties  = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 20 }
const abaRow: React.CSSProperties     = { display: 'flex', borderBottom: '1px solid #e2e8f0' }
const abaAtivaStyle = (cor: string): React.CSSProperties => ({ flex: 1, padding: '14px 0', border: 'none', background: '#fff', borderBottom: `3px solid ${cor}`, color: cor, fontWeight: 700, cursor: 'pointer', fontSize: 14 })
const abaInativa: React.CSSProperties = { flex: 1, padding: '14px 0', border: 'none', background: '#f8fafc', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: 14 }
const itemLinha = (tipo: string): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f1f5f9', borderLeft: `4px solid ${tipo === 'entrada' ? '#16a34a' : '#dc2626'}` })
const btnExcluir: React.CSSProperties = { background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }

const btnSugestao: React.CSSProperties = { background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', fontWeight: 600 }

// Diário
const btnNovoDiario: React.CSSProperties  = { background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }
const formDiario: React.CSSProperties    = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }
const diarioGrid: React.CSSProperties    = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }
const formGrupoD: React.CSSProperties    = { display: 'flex', flexDirection: 'column', gap: 4 }
const textareaSt: React.CSSProperties    = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical' as const, fontFamily: 'inherit' }
const btnSalvarDiario: React.CSSProperties = { background: '#0f172a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }
const diarioItem: React.CSSProperties    = { border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 10 }
const diarioDataBadge: React.CSSProperties = { background: '#f1f5f9', borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 44 }
const diarioExpandidoBox: React.CSSProperties = { marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }
const btnExcluirDiario: React.CSSProperties = { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, padding: 0, marginTop: 8 }
const badgeProblema: React.CSSProperties  = { background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }