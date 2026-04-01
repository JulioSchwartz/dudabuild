import { supabase } from './supabase'

export const opcoesFinanceiro = [
  { label: 'Entrada', value: 'entrada' },
  { label: 'Saída', value: 'saida' }
]

export async function lancarMovimento({
  obra_id,
  tipo,
  descricao,
  valor
}: any) {

  await supabase.from('financeiro').insert({
    obra_id,
    tipo,
    descricao,
    valor
  })
}