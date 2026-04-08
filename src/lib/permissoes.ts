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
  basico: ['obras'],
  pro: ['obras', 'orcamentos'],
  premium: ['obras', 'orcamentos', 'financeiro', 'relatorios'],
  admin: ['obras', 'orcamentos', 'financeiro', 'relatorios', 'usuarios'],
}

// ✅ FUNÇÃO PRINCIPAL
export function podeAcessar(plano: Plano, recurso: Recurso): boolean {
  if (plano === 'admin') return true
  return permissoes[plano]?.includes(recurso)
}

// ✅ VERIFICA MÚLTIPLOS ACESSOS
export function podeAcessarAlgum(plano: Plano, recursos: Recurso[]) {
  if (plano === 'admin') return true
  return recursos.some((r) => permissoes[plano]?.includes(r))
}

// 🚫 BLOQUEIO (útil pra UI)
export function bloquearSeSemPermissao(
  plano: Plano,
  recurso: Recurso
) {
  if (!podeAcessar(plano, recurso)) {
    throw new Error('Plano não permite acesso a este recurso')
  }
}