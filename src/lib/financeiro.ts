import { supabase } from './supabase'

export async function lancarMovimento({
  obra_id,
  empresa_id,
  tipo,
  descricao,
  valor
}: any) {

  if (!obra_id || !empresa_id) {
    throw new Error('Dados inválidos')
  }

  const { error } = await supabase.from('financeiro').insert({
    obra_id,
    empresa_id,
    tipo,
    descricao,
    valor: Number(valor)
  })

  if (error) {
    console.error(error)
    throw error
  }
}