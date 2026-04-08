// 🔐 TIPOS DE PLANO
export type Plano = 'basico' | 'pro' | 'premium' | 'admin'
 
// 🔐 RECURSOS DO SISTEMA
export type Recurso =
  | 'obras'
  | 'orcamentos'
  | 'financeiro'
  | 'relatorios'
  | 'usuarios'
 
// 🔐 REGRAS DE PERMISSÃO
const permissoes: Record<Plano, Recurso[]> = {
  basico:  ['obras'],
  pro:     ['obras', 'orcamentos'],
  premium: ['obras', 'orcamentos', 'financeiro', 'relatorios'],
  admin:   ['obras', 'orcamentos', 'financeiro', 'relatorios', 'usuarios'],
}
 
// ✅ FUNÇÃO PRINCIPAL
export function podeAcessar(plano: Plano, recurso: Recurso): boolean {
  if (plano === 'admin') return true
  return permissoes[plano]?.includes(recurso) ?? false
}
 
// ✅ VERIFICA MÚLTIPLOS RECURSOS
export function podeAcessarAlgum(plano: Plano, recursos: Recurso[]): boolean {
  if (plano === 'admin') return true
  return recursos.some(r => permissoes[plano]?.includes(r))
}
 
// 🚫 LANÇA ERRO SE SEM PERMISSÃO
export function bloquearSeSemPermissao(plano: Plano, recurso: Recurso): void {
  if (!podeAcessar(plano, recurso)) {
    throw new Error(`Plano "${plano}" não permite acesso ao recurso "${recurso}"`)
  }
}
 
// 📋 LISTA DE ADMINS (server-side only)
export const ADMIN_EMAILS = [
  'j.ulioschwartz@hotmail.com',
  'julio@teste.com',
  'admin@duda.com',
]