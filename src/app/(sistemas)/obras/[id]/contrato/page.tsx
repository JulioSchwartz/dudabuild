'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

// Catálogo completo de normas disponíveis
const NORMAS_CATALOGO = [
  // NBR — Desempenho e Estrutura
  { id: 'NBR15575', codigo: 'NBR 15575', desc: 'Desempenho de Edificações Habitacionais', categoria: 'Desempenho', padrao: true },
  { id: 'NBR6118',  codigo: 'NBR 6118',  desc: 'Projeto de Estruturas de Concreto Armado', categoria: 'Estrutura', padrao: true },
  { id: 'NBR6122',  codigo: 'NBR 6122',  desc: 'Projeto e Execução de Fundações', categoria: 'Estrutura', padrao: true },
  { id: 'NBR6120',  codigo: 'NBR 6120',  desc: 'Ações para o Cálculo de Estruturas de Edificações', categoria: 'Estrutura', padrao: false },
  { id: 'NBR7190',  codigo: 'NBR 7190',  desc: 'Projeto de Estruturas de Madeira', categoria: 'Estrutura', padrao: false },
  { id: 'NBR6136',  codigo: 'NBR 6136',  desc: 'Blocos de Concreto para Alvenaria', categoria: 'Alvenaria', padrao: false },
  // NBR — Instalações
  { id: 'NBR5626',  codigo: 'NBR 5626',  desc: 'Instalação Predial de Água Fria', categoria: 'Hidráulica', padrao: true },
  { id: 'NBR8160',  codigo: 'NBR 8160',  desc: 'Sistemas Prediais de Esgoto Sanitário', categoria: 'Hidráulica', padrao: false },
  { id: 'NBR10844', codigo: 'NBR 10844', desc: 'Instalações Prediais de Águas Pluviais', categoria: 'Hidráulica', padrao: false },
  { id: 'NBR5410',  codigo: 'NBR 5410',  desc: 'Instalações Elétricas de Baixa Tensão', categoria: 'Elétrica', padrao: true },
  { id: 'NBR5444',  codigo: 'NBR 5444',  desc: 'Símbolos Gráficos para Instalações Elétricas Prediais', categoria: 'Elétrica', padrao: false },
  { id: 'NBR13103', codigo: 'NBR 13103', desc: 'Instalação de Aparelhos a Gás para Uso Residencial', categoria: 'Gás', padrao: false },
  // NBR — Revestimento e Acabamento
  { id: 'NBR13749', codigo: 'NBR 13749', desc: 'Revestimento de Paredes e Tetos com Argamassas', categoria: 'Revestimento', padrao: false },
  { id: 'NBR13753', codigo: 'NBR 13753', desc: 'Revestimento de Piso com Placas Cerâmicas', categoria: 'Revestimento', padrao: false },
  { id: 'NBR15270', codigo: 'NBR 15270', desc: 'Componentes Cerâmicos — Tijolos e Blocos', categoria: 'Alvenaria', padrao: false },
  // NBR — Cobertura e Impermeabilização
  { id: 'NBR9575',  codigo: 'NBR 9575',  desc: 'Impermeabilização — Seleção e Projeto', categoria: 'Impermeabilização', padrao: false },
  { id: 'NBR9574',  codigo: 'NBR 9574',  desc: 'Execução de Impermeabilização', categoria: 'Impermeabilização', padrao: false },
  { id: 'NBR7190B', codigo: 'NBR 15873', desc: 'Critérios para Elaboração de Orçamentos', categoria: 'Orçamento', padrao: false },
  // NBR — Acessibilidade e Segurança
  { id: 'NBR9050',  codigo: 'NBR 9050',  desc: 'Acessibilidade em Edificações', categoria: 'Acessibilidade', padrao: true },
  { id: 'NBR9077',  codigo: 'NBR 9077',  desc: 'Saídas de Emergência em Edifícios', categoria: 'Segurança', padrao: false },
  { id: 'NBR5674',  codigo: 'NBR 5674',  desc: 'Manutenção de Edificações — Requisitos', categoria: 'Manutenção', padrao: false },
  // NRs — Segurança do Trabalho
  { id: 'NR18',     codigo: 'NR-18',     desc: 'Segurança e Saúde no Trabalho na Construção', categoria: 'Segurança Trabalho', padrao: true },
  { id: 'NR6',      codigo: 'NR-6',      desc: 'Equipamentos de Proteção Individual (EPIs)', categoria: 'Segurança Trabalho', padrao: true },
  { id: 'NR35',     codigo: 'NR-35',     desc: 'Trabalho em Altura', categoria: 'Segurança Trabalho', padrao: false },
  { id: 'NR10',     codigo: 'NR-10',     desc: 'Segurança em Instalações e Serviços em Eletricidade', categoria: 'Segurança Trabalho', padrao: false },
  // Legislação
  { id: 'LEI6496',  codigo: 'Lei 6.496/77', desc: 'Anotação de Responsabilidade Técnica (ART)', categoria: 'Legislação', padrao: true },
  { id: 'CC618',    codigo: 'Art. 618 CC',  desc: 'Garantia da Obra — Código Civil', categoria: 'Legislação', padrao: true },
  { id: 'CC10406',  codigo: 'Lei 10.406/02', desc: 'Código Civil Brasileiro', categoria: 'Legislação', padrao: true },
]

const CATEGORIAS = [...new Set(NORMAS_CATALOGO.map(n => n.categoria))]

export default function ContratoObra() {

  const { id }        = useParams<{ id: string }>()
  const router        = useRouter()
  const { empresaId } = useEmpresa()

  const [obra,    setObra]    = useState<any>(null)
  const [empresa, setEmpresa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)

  // Normas selecionadas — começa com as padrão marcadas
  const [normasSelecionadas, setNormasSelecionadas] = useState<Set<string>>(
    new Set(NORMAS_CATALOGO.filter(n => n.padrao).map(n => n.id))
  )
  const [catExpandida, setCatExpandida] = useState<string | null>(null)

  // Campos do contrato
  const [nomeCliente,     setNomeCliente]     = useState('')
  const [cpfCliente,      setCpfCliente]      = useState('')
  const [enderecoCliente, setEnderecoCliente] = useState('')
  const [enderecoObra,    setEnderecoObra]    = useState('')
  const [valorContrato,   setValorContrato]   = useState('')
  const [formaPagamento,  setFormaPagamento]  = useState('Conforme cronograma de medições')
  const [prazoExecucao,   setPrazoExecucao]   = useState('')
  const [dataInicio,      setDataInicio]      = useState('')
  const [multaDiaria,     setMultaDiaria]     = useState('0,5')
  const [garantiaMeses,   setGarantiaMeses]   = useState('60')
  const [dataContrato,    setDataContrato]    = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (empresaId && id) carregar()
  }, [empresaId, id])

  async function carregar() {
    try {
      const [{ data: obraData }, { data: empData }] = await Promise.all([
        supabase.from('obras').select('*').eq('id', Number(id)).maybeSingle(),
        supabase.from('empresas').select('*').eq('id', empresaId).maybeSingle(),
      ])
      setObra(obraData)
      setEmpresa(empData)
      if (obraData) {
        setNomeCliente(obraData.cliente   || '')
        setEnderecoObra(obraData.endereco || '')
        setValorContrato(String(obraData.valor || ''))
        if (obraData.data_inicio) setDataInicio(obraData.data_inicio)
        if (obraData.data_previsao && obraData.data_inicio) {
          const dias = Math.ceil((new Date(obraData.data_previsao).getTime() - new Date(obraData.data_inicio).getTime()) / 86400000)
          setPrazoExecucao(String(dias))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function toggleNorma(id: string) {
    setNormasSelecionadas(prev => {
      const novo = new Set(prev)
      novo.has(id) ? novo.delete(id) : novo.add(id)
      return novo
    })
  }

  function selecionarCategoria(cat: string, selecionar: boolean) {
    const ids = NORMAS_CATALOGO.filter(n => n.categoria === cat).map(n => n.id)
    setNormasSelecionadas(prev => {
      const novo = new Set(prev)
      ids.forEach(id => selecionar ? novo.add(id) : novo.delete(id))
      return novo
    })
  }

  const normasSel = NORMAS_CATALOGO.filter(n => normasSelecionadas.has(n.id))

  function fmt(v: number) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  async function gerarContratoPDF() {
    if (!nomeCliente.trim())         return alert('Informe o nome do cliente')
    if (!empresa?.responsavel_nome)  return alert('Preencha o Perfil da Empresa com os dados do responsável técnico.')
    if (!valorContrato)              return alert('Informe o valor do contrato')
    if (normasSel.length === 0)      return alert('Selecione ao menos uma norma técnica.')

    setGerando(true)
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      const emp     = empresa || {}
      const val     = Number(valorContrato)
      const hoje    = new Date(dataContrato + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      const nomeEmp = emp.razao_social || emp.nome || 'CONTRATADA'
      const cidade  = emp.cidade || '___________'
      const uf      = emp.estado || 'SC'

      // Gera lista de normas selecionadas para o PDF
      const normasHTML = normasSel.map(n =>
        `<li><strong>${n.codigo}</strong> — ${n.desc}</li>`
      ).join('')

      const html = `
        <div style="font-family:'Times New Roman',serif;color:#0f172a;font-size:12pt;line-height:1.8;padding:0">

          <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:20px;margin-bottom:30px">
            <h1 style="font-size:16pt;font-weight:bold;margin:0;letter-spacing:2px">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
            <h2 style="font-size:13pt;font-weight:normal;margin:6px 0 0">DE CONSTRUÇÃO CIVIL</h2>
            <p style="font-size:10pt;color:#475569;margin:8px 0 0">
              Contrato nº ${String(id).padStart(4, '0')}/${new Date().getFullYear()} · ${cidade}/${uf}
            </p>
          </div>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px">
            CLÁUSULA 1ª — DAS PARTES CONTRATANTES
          </h3>
          <p>
            <strong>CONTRATADA:</strong> ${nomeEmp}, pessoa jurídica de direito privado,
            inscrita no CNPJ sob nº <strong>${emp.cnpj || '___.___.___/____-__'}</strong>,
            com sede na ${emp.endereco || '___________'}, ${cidade}/${uf},
            neste ato representada por <strong>${emp.responsavel_nome || '___________'}</strong>,
            portador(a) do CPF nº ${emp.responsavel_documento || '___.___.___-__'},
            detentor(a) do ${emp.tipo_registro || 'CREA'} nº <strong>${emp.responsavel_registro || '___________'}</strong>,
            doravante denominada simplesmente <strong>CONTRATADA</strong>.
          </p>
          <p>
            <strong>CONTRATANTE:</strong> <strong>${nomeCliente}</strong>,
            ${cpfCliente ? `portador(a) do CPF nº ${cpfCliente},` : ''}
            residente e domiciliado(a) em ${enderecoCliente || '___________'},
            doravante denominado(a) simplesmente <strong>CONTRATANTE</strong>.
          </p>
          <p>As partes acima qualificadas têm entre si, justo e acordado, o presente Contrato de Prestação de Serviços de Construção Civil, que se regerá pelas cláusulas e condições seguintes:</p>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 2ª — DO OBJETO
          </h3>
          <p>
            O presente contrato tem como objeto a prestação de serviços de construção civil referente à obra
            <strong> "${obra?.nome || 'Obra'}"</strong>, localizada em
            <strong>${enderecoObra || '___________'}</strong>, conforme memorial descritivo, projetos e
            especificações técnicas previamente aprovados pelas partes, que passam a integrar o presente instrumento.
          </p>
          <p>Os serviços serão executados em conformidade com as seguintes normas técnicas aplicáveis a esta obra:</p>
          <ul style="margin:8px 0;padding-left:24px">${normasHTML}</ul>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 3ª — DO VALOR E FORMA DE PAGAMENTO
          </h3>
          <p>
            O valor total dos serviços objeto deste contrato é de <strong>${fmt(val)}</strong>,
            a ser pago pelo CONTRATANTE à CONTRATADA da seguinte forma: <strong>${formaPagamento}</strong>.
          </p>
          <p>
            O não pagamento de qualquer parcela no prazo estipulado implicará em multa de <strong>2% (dois por cento)</strong>
            sobre o valor em atraso, acrescida de juros moratórios de <strong>1% (um por cento)</strong> ao mês,
            calculados pro rata die.
          </p>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 4ª — DO PRAZO DE EXECUÇÃO
          </h3>
          <p>
            O prazo para execução dos serviços é de <strong>${prazoExecucao || '___'} dias corridos</strong>,
            contados a partir de <strong>${dataInicio ? new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '___/___/______'}</strong>.
          </p>
          <p>
            O prazo poderá ser prorrogado mediante aditivo contratual nos casos de: força maior ou caso fortuito;
            paralisação por atraso no pagamento superior a 15 dias; chuvas que impeçam os serviços por mais de 5 dias consecutivos;
            ou alterações solicitadas pelo CONTRATANTE.
          </p>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 5ª — DAS PENALIDADES POR ATRASO
          </h3>
          <p>
            Em caso de atraso injustificado na entrega da obra, a CONTRATADA ficará sujeita ao pagamento de
            multa diária de <strong>${multaDiaria}%</strong> sobre o valor total do contrato,
            limitada a <strong>10%</strong> do valor contratual total.
          </p>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 6ª — DAS RESPONSABILIDADES DA CONTRATADA
          </h3>
          <p>Compete à CONTRATADA:</p>
          <ul style="margin:8px 0;padding-left:24px">
            <li>Executar os serviços com técnica e qualidade, dentro das normas elencadas na Cláusula 2ª;</li>
            <li>Emitir a <strong>ART/RRT</strong> junto ao CREA/CAU antes do início das obras;</li>
            <li>Fornecer e manter atualizados todos os registros do <strong>Diário de Obra</strong>;</li>
            ${normasSelecionadas.has('NR18') ? '<li>Cumprir rigorosamente a <strong>NR-18</strong> — Segurança e Saúde no Trabalho na Construção;</li>' : ''}
            ${normasSelecionadas.has('NR6')  ? '<li>Fornecer todos os Equipamentos de Proteção Individual conforme <strong>NR-6</strong>;</li>' : ''}
            ${normasSelecionadas.has('NR35') ? '<li>Garantir segurança no trabalho em altura conforme <strong>NR-35</strong>;</li>' : ''}
            ${normasSelecionadas.has('NR10') ? '<li>Assegurar segurança em serviços elétricos conforme <strong>NR-10</strong>;</li>' : ''}
            <li>Responsabilizar-se por todos os encargos trabalhistas, previdenciários e fiscais de seus empregados;</li>
            <li>Manter o canteiro de obras organizado, sinalizado e com condições sanitárias adequadas;</li>
            <li>Comunicar imediatamente ao CONTRATANTE qualquer evento que possa alterar o prazo ou custo da obra.</li>
          </ul>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 7ª — DAS RESPONSABILIDADES DO CONTRATANTE
          </h3>
          <p>Compete ao CONTRATANTE:</p>
          <ul style="margin:8px 0;padding-left:24px">
            <li>Efetuar os pagamentos nas datas avençadas;</li>
            <li>Fornecer à CONTRATADA acesso irrestrito ao local da obra;</li>
            <li>Disponibilizar os projetos aprovados e demais documentos necessários;</li>
            <li>Comunicar à CONTRATADA, por escrito, qualquer alteração desejada no projeto original;</li>
            <li>Não interferir na direção técnica dos trabalhos.</li>
          </ul>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 8ª — DA GARANTIA
          </h3>
          <p>
            A CONTRATADA garante a solidez e segurança da obra pelo prazo de
            <strong>${garantiaMeses} meses</strong> a contar da data de entrega,
            em conformidade com o Art. 618 do Código Civil Brasileiro
            ${normasSelecionadas.has('NBR15575') ? 'e com os prazos mínimos estabelecidos pela <strong>NBR 15575</strong>' : ''}.
          </p>
          ${normasSelecionadas.has('NBR15575') ? `
          <ul style="margin:8px 0;padding-left:24px">
            <li><strong>Estrutura (fundação, pilares, vigas, lajes):</strong> 60 meses mínimo;</li>
            <li><strong>Impermeabilização:</strong> 60 meses;</li>
            <li><strong>Revestimentos externos:</strong> 36 meses;</li>
            <li><strong>Instalações hidráulicas e elétricas:</strong> 24 meses;</li>
            <li><strong>Revestimentos internos e pintura:</strong> 12 meses.</li>
          </ul>` : ''}
          <p>A garantia não abrange danos decorrentes de uso inadequado ou falta de manutenção pelo CONTRATANTE.</p>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 9ª — DA RESCISÃO
          </h3>
          <p>O presente contrato poderá ser rescindido: por mútuo acordo; por descumprimento de qualquer cláusula
          após notificação prévia de 15 dias; por atraso no pagamento superior a 30 dias; ou por paralisação
          injustificada da obra por mais de 15 dias.</p>
          <p>Em caso de rescisão por culpa do CONTRATANTE, este deverá pagar os serviços executados acrescidos de
          multa de <strong>10%</strong> do valor restante do contrato.</p>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 10ª — DAS DISPOSIÇÕES GERAIS
          </h3>
          <p>
            Este contrato é regido pela legislação brasileira, especialmente pelo Código Civil (Lei 10.406/2002),
            Lei 6.496/77 e demais normas aplicáveis à construção civil.
            Qualquer alteração somente terá validade se feita por escrito e assinada por ambas as partes.
          </p>

          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 11ª — DO FORO
          </h3>
          <p>
            Para dirimir quaisquer litígios, as partes elegem o foro da Comarca de
            <strong>${cidade}/${uf}</strong>, com renúncia a qualquer outro.
          </p>

          <div style="margin-top:48px">
            <p style="text-align:center">${cidade}/${uf}, ${hoje}.</p>
            <div style="display:flex;justify-content:space-between;margin-top:48px;gap:40px">
              <div style="flex:1;text-align:center">
                <div style="border-top:1px solid #0f172a;padding-top:10px">
                  <p style="font-weight:bold;margin:0">${nomeEmp}</p>
                  <p style="margin:2px 0;font-size:10pt">CNPJ: ${emp.cnpj || '___.___.___/____-__'}</p>
                  <p style="margin:2px 0;font-size:10pt">${emp.responsavel_nome || ''}</p>
                  <p style="margin:2px 0;font-size:10pt">${emp.tipo_registro || 'CREA'}: ${emp.responsavel_registro || ''}</p>
                  <p style="font-size:10pt;font-weight:bold">CONTRATADA</p>
                </div>
              </div>
              <div style="flex:1;text-align:center">
                <div style="border-top:1px solid #0f172a;padding-top:10px">
                  <p style="font-weight:bold;margin:0">${nomeCliente}</p>
                  ${cpfCliente ? `<p style="margin:2px 0;font-size:10pt">CPF: ${cpfCliente}</p>` : '<p style="margin:2px 0;font-size:10pt"> </p>'}
                  <p style="font-size:10pt;font-weight:bold">CONTRATANTE</p>
                </div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:48px;gap:40px">
              <div style="flex:1;text-align:center">
                <div style="border-top:1px solid #0f172a;padding-top:10px">
                  <p style="font-size:10pt">Testemunha 1 · CPF: _____________</p>
                </div>
              </div>
              <div style="flex:1;text-align:center">
                <div style="border-top:1px solid #0f172a;padding-top:10px">
                  <p style="font-size:10pt">Testemunha 2 · CPF: _____________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `

      const el = document.createElement('div')
      el.innerHTML = html
      await html2pdf().from(el).set({
        margin:      [15, 15, 15, 15],
        filename:    `Contrato_${nomeCliente.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save()

    } catch (err) {
      console.error(err)
      alert('Erro ao gerar contrato')
    } finally {
      setGerando(false)
    }
  }

  if (loading) return <p style={{ padding: 24 }}>Carregando...</p>

  const perfilIncompleto = !empresa?.responsavel_nome || !empresa?.responsavel_registro || !empresa?.cnpj

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      <button onClick={() => router.back()} style={btnVoltar}>← Voltar para a Obra</button>
      <div style={{ marginBottom: 24 }}>
        <h1 style={titulo}>📄 Gerar Contrato</h1>
        <p style={subtitulo}>Obra: <strong>{obra?.nome}</strong></p>
      </div>

      {perfilIncompleto && (
        <div style={alertaPerfil}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Perfil da empresa incompleto</p>
          <p style={{ fontSize: 13 }}>
            Preencha os dados da empresa em{' '}
            <span style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => router.push('/perfil')}>Perfil da Empresa</span>.
          </p>
        </div>
      )}

      {/* DADOS DO CONTRATANTE */}
      <Secao titulo="Dados do Contratante (Cliente)">
        <div style={formGrid}>
          <Campo label="Nome completo *">
            <input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} style={input} />
          </Campo>
          <Campo label="CPF">
            <input value={cpfCliente} onChange={e => setCpfCliente(e.target.value)} placeholder="000.000.000-00" style={input} />
          </Campo>
          <Campo label="Endereço do cliente" full>
            <input value={enderecoCliente} onChange={e => setEnderecoCliente(e.target.value)} placeholder="Rua, número, cidade/UF" style={input} />
          </Campo>
        </div>
      </Secao>

      {/* DADOS DA OBRA */}
      <Secao titulo="Dados da Obra e Contrato">
        <div style={formGrid}>
          <Campo label="Endereço da obra" full>
            <input value={enderecoObra} onChange={e => setEnderecoObra(e.target.value)} placeholder="Rua, número, cidade/UF" style={input} />
          </Campo>
          <Campo label="Valor do contrato (R$) *">
            <input type="number" value={valorContrato} onChange={e => setValorContrato(e.target.value)} style={input} min="0" step="0.01" />
          </Campo>
          <Campo label="Prazo de execução (dias)">
            <input type="number" value={prazoExecucao} onChange={e => setPrazoExecucao(e.target.value)} placeholder="Ex: 180" style={input} min="1" />
          </Campo>
          <Campo label="Data de início">
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={input} />
          </Campo>
          <Campo label="Data do contrato">
            <input type="date" value={dataContrato} onChange={e => setDataContrato(e.target.value)} style={input} />
          </Campo>
          <Campo label="Forma de pagamento" full>
            <input value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} style={input} />
          </Campo>
        </div>
      </Secao>

      {/* PENALIDADES */}
      <Secao titulo="Penalidades e Garantia">
        <div style={formGrid}>
          <Campo label="Multa diária por atraso (%)">
            <input value={multaDiaria} onChange={e => setMultaDiaria(e.target.value)} placeholder="0,5" style={input} />
          </Campo>
          <Campo label="Prazo de garantia">
            <select value={garantiaMeses} onChange={e => setGarantiaMeses(e.target.value)} style={input}>
              <option value="60">60 meses — mínimo NBR 15575</option>
              <option value="84">84 meses — 7 anos</option>
              <option value="120">120 meses — 10 anos</option>
            </select>
          </Campo>
        </div>
      </Secao>

      {/* SELEÇÃO DE NORMAS */}
      <div style={secaoCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={secaoTitulo}>📋 Normas Técnicas Aplicáveis</p>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {normasSelecionadas.size} norma(s) selecionada(s)
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
          Selecione apenas as normas pertinentes a esta obra. Elas aparecerão na Cláusula 2ª do contrato.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setNormasSelecionadas(new Set(NORMAS_CATALOGO.map(n => n.id)))}
            style={btnSelAll}>Selecionar todas</button>
          <button onClick={() => setNormasSelecionadas(new Set())}
            style={btnSelNone}>Limpar seleção</button>
          <button onClick={() => setNormasSelecionadas(new Set(NORMAS_CATALOGO.filter(n => n.padrao).map(n => n.id)))}
            style={btnSelPadrao}>Restaurar padrão</button>
        </div>

        {CATEGORIAS.map(cat => {
          const normasCat   = NORMAS_CATALOGO.filter(n => n.categoria === cat)
          const todasMarcadas = normasCat.every(n => normasSelecionadas.has(n.id))
          const algumasMarcadas = normasCat.some(n => normasSelecionadas.has(n.id))
          const expandida   = catExpandida === cat

          return (
            <div key={cat} style={catBox}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setCatExpandida(expandida ? null : cat)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox"
                    checked={todasMarcadas}
                    ref={el => { if (el) el.indeterminate = algumasMarcadas && !todasMarcadas }}
                    onChange={e => { e.stopPropagation(); selecionarCategoria(cat, e.target.checked) }}
                    onClick={e => e.stopPropagation()}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{cat}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {normasCat.filter(n => normasSelecionadas.has(n.id)).length}/{normasCat.length}
                  </span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{expandida ? '▲' : '▼'}</span>
              </div>

              {expandida && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {normasCat.map(n => (
                    <label key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox"
                        checked={normasSelecionadas.has(n.id)}
                        onChange={() => toggleNorma(n.id)}
                        style={{ width: 15, height: 15, marginTop: 2, cursor: 'pointer', accentColor: '#2563eb' }}
                      />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{n.codigo}</span>
                        <span style={{ fontSize: 13, color: '#64748b' }}> — {n.desc}</span>
                        {n.padrao && (
                          <span style={{ fontSize: 10, background: '#dbeafe', color: '#2563eb', padding: '1px 6px', borderRadius: 999, marginLeft: 6, fontWeight: 600 }}>padrão</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* PREVIEW DAS SELECIONADAS */}
        {normasSel.length > 0 && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>
              ✅ {normasSel.length} norma(s) que constarão no contrato:
            </p>
            <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.7 }}>
              {normasSel.map(n => n.codigo).join(' · ')}
            </p>
          </div>
        )}
      </div>

      {/* BOTÕES */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
        <button onClick={() => router.back()} style={btnCancelar}>Cancelar</button>
        <button onClick={gerarContratoPDF} style={btnGerar} disabled={gerando || perfilIncompleto}>
          {gerando ? '⏳ Gerando PDF...' : '📄 Gerar Contrato PDF'}
        </button>
      </div>

    </div>
  )
}

function Secao({ titulo, children }: any) {
  return (
    <div style={secaoCard}>
      <p style={secaoTitulo}>{titulo}</p>
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

const titulo: React.CSSProperties      = { fontSize: 24, fontWeight: 800, color: '#0f172a' }
const subtitulo: React.CSSProperties   = { fontSize: 14, color: '#64748b', marginTop: 4 }
const btnVoltar: React.CSSProperties   = { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 }
const secaoCard: React.CSSProperties   = { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const secaoTitulo: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }
const formGrid: React.CSSProperties    = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const labelSt: React.CSSProperties     = { fontSize: 12, fontWeight: 600, color: '#374151' }
const input: React.CSSProperties       = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#f8fafc', width: '100%', boxSizing: 'border-box' }
const btnGerar: React.CSSProperties    = { background: '#0f172a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }
const btnCancelar: React.CSSProperties = { background: '#f1f5f9', color: '#64748b', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }
const alertaPerfil: React.CSSProperties = { background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }
const catBox: React.CSSProperties      = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }
const btnSelAll: React.CSSProperties   = { background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }
const btnSelNone: React.CSSProperties  = { background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }
const btnSelPadrao: React.CSSProperties = { background: '#f1f5f9', color: '#374151', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }