'use client'

export default function Bloqueado() {

  function pagarPlano() {

    const valor = 49

    const texto = `Pagamento plano DudaBuild - R$ ${valor}`

    const url = `https://wa.me/5511999999999?text=${encodeURIComponent(texto)}`

    window.open(url)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh'
    }}>

      <h1>Plano expirado</h1>

      <p>Para continuar usando, realize o pagamento.</p>

      <button onClick={pagarPlano} style={{
        background: '#16a34a',
        color: '#fff',
        padding: 15,
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer'
      }}>
        Pagar via WhatsApp / Pix
      </button>

    </div>
  )
}