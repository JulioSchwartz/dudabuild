import { supabase } from './supabase'

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