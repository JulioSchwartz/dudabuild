export function calcularResumo(lista:any[]) {

  const entradas = lista.filter(i=>i.tipo==='entrada')
  const saidas = lista.filter(i=>i.tipo==='saida')

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

export function fluxoMensal(lista:any[]) {

  const mapa:any = {}

  lista.forEach(item=>{
    const mes = new Date(item.created_at)
      .toLocaleDateString('pt-BR',{month:'short'})

    if(!mapa[mes]) mapa[mes] = {mes,entrada:0,saida:0}

    if(item.tipo==='entrada') mapa[mes].entrada += item.valor
    else mapa[mes].saida += item.valor
  })

  return Object.values(mapa)
}

function soma(lista:any[]){
  return lista.reduce((acc,i)=>acc+Number(i.valor),0)
}