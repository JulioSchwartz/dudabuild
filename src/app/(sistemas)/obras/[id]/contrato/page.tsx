'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function ContratoObra() {

  const { id }        = useParams<{ id: string }>()
  const router        = useRouter()
  const { empresaId } = useEmpresa()

  const [obra,        setObra]        = useState<any>(null)
  const [empresa,     setEmpresa]     = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [gerando,     setGerando]     = useState(false)

  // Campos editáveis do contrato
  const [nomeCliente,    setNomeCliente]    = useState('')
  const [cpfCliente,     setCpfCliente]     = useState('')
  const [enderecoCliente, setEnderecoCliente] = useState('')
  const [enderecoObra,   setEnderecoObra]   = useState('')
  const [valorContrato,  setValorContrato]  = useState('')
  const [formaPagamento, setFormaPagamento] = useState('Conforme cronograma de medições')
  const [prazoExecucao,  setPrazoExecucao]  = useState('')
  const [dataInicio,     setDataInicio]     = useState('')
  const [multaDiaria,    setMultaDiaria]    = useState('0,5')
  const [garantiaMeses,  setGarantiaMeses]  = useState('60')
  const [numeroCidade,   setNumeroCidade]   = useState('')
  const [dataContrato,   setDataContrato]   = useState(new Date().toISOString().split('T')[0])

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

      // Pré-preenche campos com dados existentes
      if (obraData) {
        setNomeCliente(obraData.cliente     || '')
        setEnderecoObra(obraData.endereco   || '')
        setValorContrato(String(obraData.valor || ''))
        if (obraData.data_inicio)   setDataInicio(obraData.data_inicio)
        if (obraData.data_previsao && obraData.data_inicio) {
          const ini = new Date(obraData.data_inicio)
          const fim = new Date(obraData.data_previsao)
          const dias = Math.ceil((fim.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24))
          setPrazoExecucao(String(dias))
        }
      }
      if (empData) {
        setNumeroCidade(empData.cidade || '')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function formatarMoeda(v: number) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function valorPorExtenso(v: number): string {
    // Simplificado — para valores comuns
    return `${formatarMoeda(v)}`
  }

  async function gerarContratoPDF() {
    if (!nomeCliente.trim()) return alert('Informe o nome do cliente')
    if (!empresa?.responsavel_nome) return alert('Preencha o Perfil da Empresa com os dados do responsável técnico antes de gerar o contrato.')
    if (!valorContrato) return alert('Informe o valor do contrato')

    setGerando(true)
    try {
      const { default: html2pdf } = await import('html2pdf.js')

      const emp  = empresa || {}
      const val  = Number(valorContrato)
      const hoje = new Date(dataContrato + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      const nomeEmp = emp.razao_social || emp.nome || 'CONTRATADA'
      const cidade  = emp.cidade || numeroCidade || '___________'
      const uf      = emp.estado || 'SC'

      const html = `
        <div style="font-family:'Times New Roman',serif;color:#0f172a;font-size:12pt;line-height:1.8;padding:0">

          <!-- CABEÇALHO -->
          <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:20px;margin-bottom:30px">
            <h1 style="font-size:16pt;font-weight:bold;margin:0;letter-spacing:2px">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
            <h2 style="font-size:13pt;font-weight:normal;margin:6px 0 0">DE CONSTRUÇÃO CIVIL</h2>
            <p style="font-size:10pt;color:#475569;margin:8px 0 0">
              Contrato nº ${String(id).padStart(4, '0')}/${new Date().getFullYear()} · ${cidade}/${uf}
            </p>
          </div>

          <!-- QUALIFICAÇÃO DAS PARTES -->
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

          <!-- OBJETO -->
          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 2ª — DO OBJETO
          </h3>
          <p>
            O presente contrato tem como objeto a prestação de serviços de construção civil referente à obra
            <strong> "${obra?.nome || 'Obra'}"</strong>, localizada em
            <strong>${enderecoObra || '___________'}</strong>, conforme memorial descritivo, projetos e
            especificações técnicas previamente aprovados pelas partes, que passam a integrar o presente instrumento.
          </p>
          <p>
            Os serviços serão executados em conformidade com as normas técnicas da ABNT aplicáveis, especialmente:
          </p>
          <ul style="margin:8px 0;padding-left:24px">
            <li><strong>NBR 15575</strong> — Desempenho de Edificações Habitacionais</li>
            <li><strong>NBR 6118</strong> — Projeto de Estruturas de Concreto Armado</li>
            <li><strong>NBR 6122</strong> — Projeto e Execução de Fundações</li>
            <li><strong>NBR 9050</strong> — Acessibilidade em Edificações</li>
            <li><strong>NBR 5626</strong> — Instalação Predial de Água Fria</li>
            <li><strong>NBR 5410</strong> — Instalações Elétricas de Baixa Tensão</li>
          </ul>

          <!-- VALOR E PAGAMENTO -->
          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 3ª — DO VALOR E FORMA DE PAGAMENTO
          </h3>
          <p>
            O valor total dos serviços objeto deste contrato é de
            <strong>${formatarMoeda(val)}</strong> (${valorPorExtenso(val)}),
            a ser pago pelo CONTRATANTE à CONTRATADA da seguinte forma:
            <strong>${formaPagamento}</strong>.
          </p>
          <p>
            O não pagamento de qualquer parcela no prazo estipulado implicará em multa de <strong>2% (dois por cento)</strong>
            sobre o valor em atraso, acrescida de juros moratórios de <strong>1% (um por cento)</strong> ao mês,
            calculados pro rata die, sem prejuízo das demais penalidades previstas neste instrumento.
          </p>

          <!-- PRAZO -->
          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 4ª — DO PRAZO DE EXECUÇÃO
          </h3>
          <p>
            O prazo para execução dos serviços é de <strong>${prazoExecucao || '___'} (${prazoExecucao || '___'}) dias corridos</strong>,
            contados a partir de <strong>${dataInicio ? new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '___/___/______'}</strong>,
            data de início efetivo dos trabalhos.
          </p>
          <p>
            O prazo poderá ser prorrogado mediante aditivo contratual, nos casos de:
            força maior ou caso fortuito; paralisação por atraso no pagamento superior a 15 (quinze) dias;
            chuvas contínuas que impeçam a execução dos serviços por mais de 5 (cinco) dias consecutivos;
            alterações solicitadas pelo CONTRATANTE que impliquem em modificação do escopo original.
          </p>

          <!-- PENALIDADES POR ATRASO -->
          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 5ª — DAS PENALIDADES POR ATRASO
          </h3>
          <p>
            Em caso de atraso injustificado na entrega da obra, a CONTRATADA ficará sujeita ao pagamento de
            multa diária de <strong>${multaDiaria}% (${multaDiaria} por cento)</strong> sobre o valor total do
            contrato, limitada a <strong>10% (dez por cento)</strong> do valor contratual total.
          </p>

          <!-- RESPONSABILIDADES DA CONTRATADA -->
          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 6ª — DAS RESPONSABILIDADES DA CONTRATADA
          </h3>
          <p>Compete à CONTRATADA:</p>
          <ul style="margin:8px 0;padding-left:24px">
            <li>Executar os serviços com técnica, qualidade e dentro das normas da ABNT;</li>
            <li>Emitir a <strong>ART/RRT</strong> junto ao CREA/CAU antes do início das obras;</li>
            <li>Fornecer e manter atualizados todos os registros do <strong>Diário de Obra</strong>;</li>
            <li>Cumprir rigorosamente a <strong>NR-18</strong> (Segurança na Construção Civil) e a <strong>NR-6</strong> (EPIs);</li>
            <li>Fornecer todos os equipamentos de proteção individual e coletiva necessários;</li>
            <li>Responsabilizar-se por todos os encargos trabalhistas, previdenciários e fiscais de seus empregados;</li>
            <li>Manter o canteiro de obras organizado, sinalizado e com as condições sanitárias exigidas pela NR-18;</li>
            <li>Providenciar o alvará de construção e demais licenças necessárias à execução da obra, salvo disposição contrária;</li>
            <li>Comunicar imediatamente ao CONTRATANTE qualquer evento que possa alterar o prazo ou custo da obra.</li>
          </ul>

          <!-- RESPONSABILIDADES DO CONTRATANTE -->
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

          <!-- GARANTIA -->
          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 8ª — DA GARANTIA
          </h3>
          <p>
            A CONTRATADA garante a solidez e segurança da obra pelo prazo de
            <strong>${garantiaMeses} (${garantiaMeses === '60' ? 'sessenta' : garantiaMeses}) meses</strong>
            a contar da data de entrega, em conformidade com o Art. 618 do Código Civil Brasileiro e
            com os prazos mínimos estabelecidos pela <strong>NBR 15575</strong>:
          </p>
          <ul style="margin:8px 0;padding-left:24px">
            <li><strong>Estrutura (fundação, pilares, vigas, lajes):</strong> 60 meses mínimo;</li>
            <li><strong>Impermeabilização:</strong> 60 meses;</li>
            <li><strong>Revestimentos externos:</strong> 36 meses;</li>
            <li><strong>Instalações hidráulicas e elétricas:</strong> 24 meses;</li>
            <li><strong>Revestimentos internos e pintura:</strong> 12 meses.</li>
          </ul>
          <p>
            A garantia não abrange danos decorrentes de uso inadequado, modificações realizadas sem autorização
            da CONTRATADA, ou falta de manutenção pelo CONTRATANTE conforme manual do proprietário.
          </p>

          <!-- RESCISÃO -->
          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 9ª — DA RESCISÃO
          </h3>
          <p>O presente contrato poderá ser rescindido:</p>
          <ul style="margin:8px 0;padding-left:24px">
            <li>Por mútuo acordo entre as partes, mediante termo aditivo;</li>
            <li>Por descumprimento de qualquer cláusula, após notificação prévia de 15 (quinze) dias;</li>
            <li>Por atraso no pagamento superior a 30 (trinta) dias;</li>
            <li>Por paralisação injustificada da obra por mais de 15 (quinze) dias.</li>
          </ul>
          <p>
            Em caso de rescisão por culpa da CONTRATANTE, esta deverá pagar à CONTRATADA o valor
            correspondente aos serviços já executados, acrescido de multa equivalente a
            <strong>10% (dez por cento)</strong> do valor restante do contrato.
          </p>

          <!-- DISPOSIÇÕES GERAIS -->
          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 10ª — DAS DISPOSIÇÕES GERAIS
          </h3>
          <p>
            Este contrato é regido pela legislação brasileira, especialmente pelo Código Civil (Lei 10.406/2002),
            Lei 6.496/77 (ART), e demais normas aplicáveis à construção civil.
            Qualquer alteração somente terá validade se feita por escrito e assinada por ambas as partes.
            Os documentos técnicos (projetos, memoriais, cronograma físico-financeiro e planilhas orçamentárias)
            integram o presente contrato como se nele estivessem transcritos.
          </p>

          <!-- FORO -->
          <h3 style="font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:24px">
            CLÁUSULA 11ª — DO FORO
          </h3>
          <p>
            Para dirimir quaisquer dúvidas ou litígios decorrentes do presente contrato, as partes elegem o foro
            da Comarca de <strong>${cidade}/${uf}</strong>, com renúncia expressa a qualquer outro,
            por mais privilegiado que seja.
          </p>

          <!-- ASSINATURAS -->
          <div style="margin-top:48px">
            <p style="text-align:center">
              ${cidade}/${uf}, ${hoje}.
            </p>

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
                  <p style="margin:2px 0;font-size:10pt"> </p>
                  <p style="font-size:10pt;font-weight:bold">CONTRATANTE</p>
                </div>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;margin-top:48px;gap:40px">
              <div style="flex:1;text-align:center">
                <div style="border-top:1px solid #0f172a;padding-top:10px">
                  <p style="font-size:10pt">Testemunha 1</p>
                  <p style="font-size:10pt">CPF: _____________</p>
                </div>
              </div>
              <div style="flex:1;text-align:center">
                <div style="border-top:1px solid #0f172a;padding-top:10px">
                  <p style="font-size:10pt">Testemunha 2</p>
                  <p style="font-size:10pt">CPF: _____________</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      `

      const el = document.createElement('div')
      el.innerHTML = html

      await html2pdf().from(el).set({
        margin:     [15, 15, 15, 15],
        filename:   `Contrato_${nomeCliente.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:      { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      <button onClick={() => router.back()} style={btnVoltar}>← Voltar para a Obra</button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={titulo}>📄 Gerar Contrato</h1>
        <p style={subtitulo}>Obra: <strong>{obra?.nome}</strong></p>
      </div>

      {perfilIncompleto && (
        <div style={alertaPerfil}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Perfil da empresa incompleto</p>
          <p style={{ fontSize: 13 }}>
            Para gerar o contrato, preencha os dados da empresa (CNPJ, responsável técnico e registro CREA/CAU) em{' '}
            <span
              style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => router.push('/perfil')}
            >
              Perfil da Empresa
            </span>.
          </p>
        </div>
      )}

      {/* DADOS DO CONTRATANTE */}
      <Secao titulo="Dados do Contratante (Cliente)">
        <div style={formGrid}>
          <Campo label="Nome completo do cliente *">
            <input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} style={input} />
          </Campo>
          <Campo label="CPF do cliente">
            <input value={cpfCliente} onChange={e => setCpfCliente(e.target.value)}
              placeholder="000.000.000-00" style={input} />
          </Campo>
          <Campo label="Endereço do cliente" full>
            <input value={enderecoCliente} onChange={e => setEnderecoCliente(e.target.value)}
              placeholder="Rua, número, cidade/UF" style={input} />
          </Campo>
        </div>
      </Secao>

      {/* DADOS DA OBRA */}
      <Secao titulo="Dados da Obra e Contrato">
        <div style={formGrid}>
          <Campo label="Endereço da obra" full>
            <input value={enderecoObra} onChange={e => setEnderecoObra(e.target.value)}
              placeholder="Rua, número, cidade/UF" style={input} />
          </Campo>
          <Campo label="Valor do contrato (R$) *">
            <input type="number" value={valorContrato} onChange={e => setValorContrato(e.target.value)}
              style={input} min="0" step="0.01" />
          </Campo>
          <Campo label="Prazo de execução (dias) *">
            <input type="number" value={prazoExecucao} onChange={e => setPrazoExecucao(e.target.value)}
              placeholder="Ex: 180" style={input} min="1" />
          </Campo>
          <Campo label="Data de início">
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={input} />
          </Campo>
          <Campo label="Data do contrato">
            <input type="date" value={dataContrato} onChange={e => setDataContrato(e.target.value)} style={input} />
          </Campo>
          <Campo label="Forma de pagamento" full>
            <input value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}
              placeholder="Ex: 30% sinal, 40% na estrutura, 30% na entrega" style={input} />
          </Campo>
        </div>
      </Secao>

      {/* PENALIDADES E GARANTIA */}
      <Secao titulo="Penalidades e Garantia">
        <div style={formGrid}>
          <Campo label="Multa diária por atraso (% sobre contrato)">
            <input value={multaDiaria} onChange={e => setMultaDiaria(e.target.value)}
              placeholder="0,5" style={input} />
          </Campo>
          <Campo label="Prazo de garantia (meses)">
            <select value={garantiaMeses} onChange={e => setGarantiaMeses(e.target.value)} style={input}>
              <option value="60">60 meses — mínimo NBR 15575 (recomendado)</option>
              <option value="84">84 meses — 7 anos</option>
              <option value="120">120 meses — 10 anos</option>
            </select>
          </Campo>
        </div>

        <div style={avisoNormas}>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 6 }}>📋 Normas aplicadas neste contrato</p>
          <p style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.7 }}>
            <strong>NBR 15575</strong> — Desempenho (prazos de garantia) ·
            <strong> NBR 6118</strong> — Estruturas de concreto ·
            <strong> NBR 6122</strong> — Fundações ·
            <strong> NBR 9050</strong> — Acessibilidade ·
            <strong> NBR 5626</strong> — Água fria ·
            <strong> NBR 5410</strong> — Instalações elétricas ·
            <strong> NR-18</strong> — Segurança no canteiro ·
            <strong> NR-6</strong> — EPIs ·
            <strong> Lei 6.496/77</strong> — ART/RRT ·
            <strong> Art. 618 CC</strong> — Garantia da obra
          </p>
        </div>
      </Secao>

      {/* BOTÃO GERAR */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button onClick={() => router.back()} style={btnCancelar}>Cancelar</button>
        <button
          onClick={gerarContratoPDF}
          style={btnGerar}
          disabled={gerando || perfilIncompleto}
        >
          {gerando ? '⏳ Gerando PDF...' : '📄 Gerar Contrato PDF'}
        </button>
      </div>

    </div>
  )
}

/* ── COMPONENTES ── */
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

/* ── ESTILOS ── */
const titulo: React.CSSProperties    = { fontSize: 24, fontWeight: 800, color: '#0f172a' }
const subtitulo: React.CSSProperties = { fontSize: 14, color: '#64748b', marginTop: 4 }
const btnVoltar: React.CSSProperties = { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 }
const secaoCard: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const secaoTitulo: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }
const formGrid: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const labelSt: React.CSSProperties   = { fontSize: 12, fontWeight: 600, color: '#374151' }
const input: React.CSSProperties     = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, background: '#f8fafc', width: '100%', boxSizing: 'border-box' }
const btnGerar: React.CSSProperties  = { background: '#0f172a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }
const btnCancelar: React.CSSProperties = { background: '#f1f5f9', color: '#64748b', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }
const alertaPerfil: React.CSSProperties = { background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }
const avisoNormas: React.CSSProperties = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', marginTop: 16 }