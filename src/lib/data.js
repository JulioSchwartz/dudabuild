export let obras = [
  {
    id: 1,
    nome: 'Casa Alto Padrão',
    cliente: 'João Silva',
    valor: 150000,
    financeiro: {
      entradas: [
        { descricao: 'Entrada inicial', valor: 50000 },
      ],
      saidas: [
        { descricao: 'Material', valor: 20000 },
      ],
    },
  },
  {
    id: 2,
    nome: 'Reforma Apartamento',
    cliente: 'Maria Souza',
    valor: 45000,
    financeiro: {
      entradas: [],
      saidas: [],
    },
  },
]
export const tiposFinanceiros = {
  entradas: [
    'Entrada inicial',
    'Parcela cliente',
    'Pagamento final',
  ],
  saidas: [
    'Material',
    'Mão de obra',
    'Equipamentos',
    'Transporte',
    'Outros',
  ],
}