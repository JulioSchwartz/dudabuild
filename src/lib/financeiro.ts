import { supabase } from './supabase'

/* =========================
   TIPOS PROFISSIONAIS
========================= */

type Movimento = {
  tipo: 'entrada' | 'saida'
  valor: number | string
  created_at?: string
}

/* =========================
   RESUMO FINANCEIRO
========================= */

export function calcularResumo(lista: Movimento[]) {

  const entradas = lista.filter(i => i.tipo === 'entrada')
  const saidas = lista.filter(i => i.tipo === 'saida')

  const receita = soma(entradas)
  const custo = soma(saidas)
  const lucro = receita - custo

  const margem = receita > 0 ? (lucro / receita) * 100 : 0
  const roi = custo > 0 ? lucro / custo : 0

  return {
    receita,
    custo,
    lucro,
    margem,
    roi
  }
}

/* =========================
   FLUXO MENSAL
========================= */

export function fluxoMensal(lista: Movimento[]) {

  const mapa: Record<string, any> = {}

  lista.forEach(item => {

    if (!item.created_at) return

    const mes = new Date(item.created_at)
      .toLocaleDateString('pt-BR', { month: 'short' })

    if (!mapa[mes]) {
      mapa[mes] = { mes, entrada: 0, saida: 0 }
    }

    if (item.tipo === 'entrada') {
      mapa[mes].entrada += Number(item.valor)
    } else {
      mapa[mes].saida += Number(item.valor)
    }
  })

  return Object.values(mapa)
}

/* =========================
   SOMA
========================= */

function soma(lista: Movimento[]) {
  return lista.reduce((acc, i) => acc + Number(i.valor || 0), 0)
}

/* =========================
   LANÇAR MOVIMENTO (CORRIGIDO)
========================= */

type Lancamento = {
  obra_id: number
  empresa_id: number
  tipo: 'entrada' | 'saida'
  descricao?: string
  valor: number | string
}

export async function lancarMovimento({
  obra_id,
  empresa_id,
  tipo,
  descricao,
  valor
}: Lancamento) {

  // 🔥 VALIDAÇÃO PROFISSIONAL
  if (!obra_id || isNaN(Number(obra_id))) {
    throw new Error('obra_id inválido')
  }

  if (!empresa_id || isNaN(Number(empresa_id))) {
    throw new Error('empresa_id inválido')
  }

  if (!tipo) {
    throw new Error('tipo obrigatório')
  }

  if (!valor) {
    throw new Error('valor obrigatório')
  }

  const { error } = await supabase
    .from('financeiro')
    .insert({
      obra_id: Number(obra_id),       // 🔥 garante bigint correto
      empresa_id: Number(empresa_id), // 🔥 garante bigint correto
      tipo,
      descricao: descricao || '',
      valor: Number(valor),
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Erro ao lançar movimento:', error)
    throw error
  }
}