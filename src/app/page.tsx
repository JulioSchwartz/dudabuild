'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [menuAberto, setMenuAberto] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [faqAberto, setFaqAberto] = useState<number | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formTel, setFormTel] = useState('')
  const [formEnviado, setFormEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroForm, setErroForm] = useState("")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuAberto(false)
  }

  async function enviarLead(e: React.FormEvent) {
    e.preventDefault()
    setErroForm('')
    setEnviando(true)
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: formNome, email: formEmail, tel: formTel }),
      })
      const data = await res.json()
      if (!res.ok) { setErroForm(data.error || 'Erro ao enviar. Tente novamente.'); return }
      setFormEnviado(true)
      const msg = encodeURIComponent(`Olá! Me chamo ${formNome} e tenho interesse no Zynplan. Vi o formulário no site.`)
      window.open(`https://wa.me/5549991587646?text=${msg}`, '_blank')
    } catch {
      setErroForm('Erro inesperado. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const funcionalidades = [
    { icon: '🏗️', titulo: 'Gestão de Obras', desc: 'Acompanhe o progresso de cada obra em tempo real com cronograma físico, etapas e medições ponderadas.' },
    { icon: '💰', titulo: 'Controle Financeiro', desc: 'Registre entradas e saídas por obra. Visualize lucro, margem e fluxo de caixa com gráficos executivos.' },
    { icon: '🧾', titulo: 'Orçamentos Inteligentes', desc: 'Monte orçamentos com autocomplete SINAPI. O cliente aprova digitalmente por link público.' },
    { icon: '📓', titulo: 'Diário de Obra', desc: 'Registre clima, equipe, serviços e ocorrências diárias. Conformidade com normas NBR.' },
    { icon: '📸', titulo: 'Fotos por Categoria', desc: 'Organize fotos por etapa. Compartilhe um link público com o cliente para acompanhamento.' },
    { icon: '👥', titulo: 'Multi-usuário', desc: 'Adicione engenheiros, mestres de obra e financeiro com permissões específicas para cada perfil.' },
    { icon: '📄', titulo: 'Contrato Digital', desc: 'Gere contratos vinculados à obra com seleção de normas NBR e assinatura digital do cliente.' },
    { icon: '📊', titulo: 'Relatórios Avançados', desc: 'Exporte relatórios completos com filtros por período, obra e categoria. Dados sempre seus.' },
  ]

  const problemas = [
    { problema: 'Planilhas que nunca fecham', solucao: 'Dashboard executivo com tudo em um lugar' },
    { problema: 'Obras sem controle de custo', solucao: 'Financeiro por obra com alertas de prejuízo' },
    { problema: 'Cliente sem visibilidade', solucao: 'Link público com fotos e progresso em tempo real' },
    { problema: 'Orçamentos perdidos no e-mail', solucao: 'Aprovação digital com registro automático' },
    { problema: 'Equipe descoordenada', solucao: 'Multi-usuário com permissões por função' },
  ]

  const planos = [
    {
      key: 'basico', nome: 'Básico', preco: 'R$ 79,90', periodo: '/mês',
      desc: 'Para autônomos e pequenas obras',
      cor: '#64748b', destaque: false,
      itens: ['2 obras simultâneas', '5 orçamentos/mês', 'Diário de obra', 'Contrato digital', 'Cronograma de etapas'],
      nao: ['Relatórios avançados', 'Multi-usuário', 'Suporte prioritário'],
    },
    {
      key: 'pro', nome: 'Pro', preco: 'R$ 149,90', periodo: '/mês',
      desc: 'Para construtoras em crescimento',
      cor: '#d4a843', destaque: true,
      itens: ['5 obras simultâneas', '15 orçamentos/mês', 'Diário de obra', 'Contrato digital', 'Cronograma de etapas', 'Relatórios avançados'],
      nao: ['Multi-usuário', 'Suporte prioritário'],
    },
    {
      key: 'premium', nome: 'Premium', preco: 'R$ 299,90', periodo: '/mês',
      desc: 'Para construtoras que exigem o melhor',
      cor: '#b8893d', destaque: false,
      itens: ['Obras ilimitadas', 'Orçamentos ilimitados', 'Diário de obra', 'Contrato digital', 'Cronograma de etapas', 'Relatórios avançados', 'Multi-usuário', 'Suporte prioritário'],
      nao: [],
    },
  ]

  const depoimentos = [
    { nome: 'Ricardo Almeida', cargo: 'Engenheiro Civil · São Paulo', texto: 'O Zynplan transformou a forma como gerencio minhas obras. Antes eu usava planilhas e perdia horas toda semana. Hoje vejo tudo em minutos.', avatar: 'R' },
    { nome: 'Fernanda Costa', cargo: 'Construtora FC · Curitiba', texto: 'A funcionalidade de orçamento com SINAPI é incrível. Meus clientes aprovam pelo link e já gera a obra automaticamente. Economizo muito tempo.', avatar: 'F' },
    { nome: 'Marcos Oliveira', cargo: 'Mestre de Obras · Florianópolis', texto: 'O diário de obra e o cronograma físico são exatamente o que precisávamos. Simples de usar e mantém tudo documentado conforme as normas.', avatar: 'M' },
  ]

  const faqs = [
    { p: 'Preciso instalar algum software?', r: 'Não. O Zynplan é 100% online e funciona em qualquer navegador, computador ou celular.' },
    { p: 'Meus dados ficam seguros?', r: 'Sim. Usamos Supabase com PostgreSQL hospedado no Brasil, com criptografia e backups automáticos. Seus dados são sempre seus.' },
    { p: 'Posso cancelar a qualquer momento?', r: 'Sim, sem multa e sem fidelidade. Se cancelar, seus dados ficam disponíveis para exportação por 30 dias.' },
    { p: 'O trial exige cartão de crédito?', r: 'Não. São 14 dias de teste completo no plano Premium sem precisar cadastrar cartão.' },
    { p: 'Quantos usuários posso ter no plano Premium?', r: 'Usuários ilimitados com perfis de Admin, Engenheiro, Mestre de Obra e Financeiro, cada um com permissões específicas.' },
    { p: 'O SINAPI está atualizado?', r: 'Sim. Nossa base SINAPI é atualizada regularmente para garantir orçamentos precisos conforme as tabelas oficiais.' },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#0a0a0f', color: '#fff', overflowX: 'hidden' }}>

      {/* GOOGLE FONTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: #d4a843; color: #000; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.45s ease both; }
        .float { animation: float 4s ease-in-out infinite; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(212,168,67,0.4); }
        .btn-primary { transition: all 0.2s ease; }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); }
        .btn-secondary { transition: all 0.2s ease; }
        .card-func:hover { transform: translateY(-4px); border-color: rgba(212,168,67,0.4); }
        .card-func { transition: all 0.2s ease; }
        .depo-card:hover { border-color: rgba(212,168,67,0.3); }
        .depo-card { transition: all 0.2s ease; }
        .gold-shimmer {
          background: linear-gradient(90deg, #d4a843, #f0c040, #b8893d, #f0c040, #d4a843);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .nav-desktop { display: flex; }
        .nav-mobile-btn { display: none; }
        .nav-mobile-menu { display: none; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-btns-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .nav-mobile-menu { display: flex !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .hero-mockup { display: none !important; }
          .cta-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,10,15,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(212,168,67,0.15)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 5%',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan" style={{ height: 36, mixBlendMode: 'screen' }} />
          </div>

          {/* Desktop Nav Links */}
          <div className="nav-desktop" style={{ alignItems: 'center', gap: 32, fontSize: 14, fontWeight: 500 }}>
            {[['funcionalidades', 'Funcionalidades'], ['planos', 'Planos'], ['depoimentos', 'Depoimentos'], ['faq', 'FAQ']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              >{label}</button>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="nav-btns-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/login')} className="btn-secondary"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              Entrar
            </button>
            <button onClick={() => router.push('/cadastro')} className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #d4a843, #f0c040)', color: '#000', padding: '9px 22px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, border: 'none' }}>
              Testar grátis →
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="nav-mobile-btn"
            onClick={() => setMenuAberto(!menuAberto)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, padding: 8 }}
          >
            <span style={{ display: 'block', width: 24, height: 2, background: menuAberto ? '#d4a843' : '#fff', borderRadius: 2, transition: 'all 0.2s', transform: menuAberto ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: 24, height: 2, background: menuAberto ? '#d4a843' : '#fff', borderRadius: 2, transition: 'all 0.2s', opacity: menuAberto ? 0 : 1 }} />
            <span style={{ display: 'block', width: 24, height: 2, background: menuAberto ? '#d4a843' : '#fff', borderRadius: 2, transition: 'all 0.2s', transform: menuAberto ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuAberto && (
          <div className="nav-mobile-menu" style={{
            display: 'flex', flexDirection: 'column',
            background: 'rgba(10,10,15,0.98)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(212,168,67,0.15)',
            padding: '16px 5% 24px',
            gap: 4,
          }}>
            {[['funcionalidades', 'Funcionalidades'], ['planos', 'Planos'], ['depoimentos', 'Depoimentos'], ['faq', 'FAQ']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, fontWeight: 500, padding: '14px 0', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
                {label}
              </button>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => router.push('/login')}
                style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 0', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 500 }}>
                Entrar
              </button>
              <button onClick={() => router.push('/cadastro')}
                style={{ flex: 1, background: 'linear-gradient(135deg, #d4a843, #f0c040)', color: '#000', padding: '12px 0', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 700, border: 'none' }}>
                Testar grátis →
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '120px 5% 80px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,168,67,0.12) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: '20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,67,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(212,168,67,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="hero-grid" style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div>
            <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: '#d4a843', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4a843', animation: 'pulse 2s infinite' }} />
              14 dias grátis · Sem cartão
            </div>

            <h1 className="fade-up-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
              Gestão de obras{' '}
              <span className="gold-shimmer">inteligente</span>
              {' '}para construtoras brasileiras
            </h1>

            <p className="fade-up-3" style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
              Do orçamento SINAPI à entrega da obra — controle financeiro, cronograma físico, diário de obra e muito mais em uma única plataforma.
            </p>

            <div className="fade-up-4" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/cadastro')} className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #d4a843, #f0c040)', color: '#000', padding: '16px 32px', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                Começar grátis por 14 dias →
              </button>
              <button onClick={() => scrollTo('funcionalidades')} className="btn-secondary"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '16px 28px', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
                Ver funcionalidades
              </button>
            </div>

            <div style={{ marginTop: 48, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[['100%', 'Online e seguro'], ['SINAPI', 'Integrado'], ['NBR', 'Conformidade']].map(([val, label]) => (
                <div key={label}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#d4a843' }}>{val}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup — some no mobile */}
          <div className="hero-mockup float" style={{ position: 'relative' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(30,30,40,0.9), rgba(15,15,25,0.95))', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 20, padding: 24, boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,168,67,0.1)', backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700 }}>Dashboard Executivo</p>
                  <p style={{ fontSize: 11, color: '#64748b' }}>Zynplan · Planejamento Inteligente</p>
                </div>
                <div style={{ background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#d4a843' }}>⭐ Premium</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[['Receita Total', 'R$ 2,4M', '#22c55e'], ['Lucro Total', 'R$ 546K', '#3b82f6'], ['Obras Ativas', '6', '#d4a843']].map(([label, val, cor]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: cor }}>{val}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>FLUXO DE CAIXA</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: i > 8 ? 'linear-gradient(180deg, #d4a843, #b8893d)' : 'rgba(212,168,67,0.2)', borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
                  ))}
                </div>
              </div>

              {[['Residencial Floripa', '78%', '#22c55e'], ['Comercial Centro', '45%', '#f59e0b']].map(([nome, perc, cor]) => (
                <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: cor, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, flex: 1 }}>{nome}</p>
                  <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: perc, height: '100%', background: cor, borderRadius: 999 }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: cor, minWidth: 32 }}>{perc}</p>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', top: -16, right: -16, background: '#22c55e', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#fff', boxShadow: '0 8px 24px rgba(34,197,94,0.4)' }}>
              ✓ Orçamento aprovado!
            </div>
            <div style={{ position: 'absolute', bottom: -16, left: -16, background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#d4a843', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              📸 Foto enviada ao cliente
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA + BENEFÍCIO */}
      <section style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#d4a843', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Por que o Zynplan?</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.2 }}>
              Chega de planilha.<br />Gestão profissional de verdade.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {problemas.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 24px' }}>
                <div>
                  <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Antes</p>
                  <p style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'line-through' }}>{item.problema}</p>
                </div>
                <div style={{ color: '#d4a843', fontSize: 20 }}>→</div>
                <div>
                  <p style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Com Zynplan</p>
                  <p style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{item.solucao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" style={{ padding: '100px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#d4a843', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Funcionalidades</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              Tudo que sua construtora precisa
            </h2>
            <p style={{ fontSize: 17, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>Uma plataforma completa pensada para o dia a dia da construção civil brasileira.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {funcionalidades.map((f, i) => (
              <div key={i} className="card-func" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px', cursor: 'default' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{f.titulo}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#d4a843', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Planos & Preços</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              Sem taxas ocultas
            </h2>
            <p style={{ fontSize: 17, color: '#64748b' }}>Cancele quando quiser. Seus dados sempre são seus.</p>
          </div>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {planos.map(p => (
              <div key={p.key} style={{
                background: p.destaque ? 'rgba(212,168,67,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1.5px solid ${p.destaque ? 'rgba(212,168,67,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: '36px 28px', width: 300, position: 'relative',
                transform: p.destaque ? 'scale(1.04)' : 'scale(1)',
                boxShadow: p.destaque ? '0 20px 60px rgba(212,168,67,0.15)' : 'none',
              }}>
                {p.destaque && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #d4a843, #f0c040)', borderRadius: 999, padding: '5px 18px', fontSize: 12, fontWeight: 700, color: '#000', whiteSpace: 'nowrap' }}>
                    🚀 Mais popular
                  </div>
                )}
                <p style={{ fontSize: 12, fontWeight: 700, color: p.cor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{p.nome}</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{p.preco}</span>
                  <span style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{p.periodo}</span>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{p.desc}</p>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {p.itens.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span style={{ color: p.cor, fontWeight: 700, fontSize: 14 }}>✓</span> {item}
                    </li>
                  ))}
                  {p.nao.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                      <span style={{ color: '#334155', fontWeight: 700, fontSize: 14 }}>×</span> {item}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push('/cadastro')} className="btn-primary"
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700,
                    background: p.destaque ? 'linear-gradient(135deg, #d4a843, #f0c040)' : 'rgba(255,255,255,0.06)',
                    color: p.destaque ? '#000' : '#fff',
                  }}>
                  Começar grátis
                </button>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: '#475569' }}>
            🔒 Pagamento seguro via Stripe · 7 dias de garantia · Cancele a qualquer momento
          </p>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" style={{ padding: '100px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#d4a843', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Depoimentos</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.2 }}>
              Quem usa, aprova
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {depoimentos.map((d, i) => (
              <div key={i} className="depo-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '32px 28px' }}>
                <div style={{ color: '#d4a843', fontSize: 28, marginBottom: 20, letterSpacing: -2 }}>★★★★★</div>
                <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>"{d.texto}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #b8893d, #d4a843)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#000' }}>{d.avatar}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{d.nome}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{d.cargo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#d4a843', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>FAQ</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.2 }}>
              Perguntas frequentes
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${faqAberto === i ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <button onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  style={{ width: '100%', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{f.p}</p>
                  <span style={{ color: '#d4a843', fontSize: 20, flexShrink: 0, transform: faqAberto === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </button>
                {faqAberto === i && (
                  <div style={{ padding: '0 24px 20px' }}>
                    <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{f.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL + FORMULÁRIO */}
      <section style={{ padding: '100px 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,168,67,0.08) 0%, transparent 70%)' }} />
        <div className="cta-grid" style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#d4a843', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Comece agora</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 24 }}>
              Pronto para transformar sua construtora?
            </h2>
            <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, marginBottom: 36 }}>
              Comece agora com 14 dias grátis no plano Premium. Sem cartão, sem compromisso.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['✓ Acesso completo por 14 dias', '✓ Sem cartão de crédito', '✓ Suporte via WhatsApp', '✓ Cancele quando quiser'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: '#cbd5e1' }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Formulário de lead */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 20, padding: 40 }}>
            {formEnviado ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Recebemos seu contato!</h3>
                <p style={{ color: '#64748b', marginBottom: 28 }}>Nossa equipe entrará em contato em breve.</p>
                <button onClick={() => router.push('/cadastro')} className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #d4a843, #f0c040)', color: '#000', padding: '14px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                  Começar agora →
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Fale com a gente</h3>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Ou cadastre-se diretamente e comece em minutos.</p>
                <form onSubmit={enviarLead} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Nome completo</label>
                    <input value={formNome} onChange={e => setFormNome(e.target.value)} required placeholder="Seu nome"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>E-mail profissional</label>
                    <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required placeholder="seu@email.com"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>WhatsApp</label>
                    <input value={formTel} onChange={e => setFormTel(e.target.value)} placeholder="(00) 00000-0000"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none' }} />
                  </div>
                  {erroForm && <p style={{ color: '#ef4444', fontSize: 13 }}>⚠ {erroForm}</p>}
                  <button type="submit" disabled={enviando} className="btn-primary"
                    style={{ background: 'linear-gradient(135deg, #d4a843, #f0c040)', color: '#000', padding: '14px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 800, marginTop: 8, opacity: enviando ? 0.7 : 1 }}>
                    {enviando ? 'Enviando...' : 'Enviar mensagem →'}
                  </button>
                  <button type="button" onClick={() => router.push('/cadastro')}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '13px 0', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    Ou criar conta agora gratuitamente
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <img src="/Logotipo_fundo_transparente_-_Zynplan.png" alt="Zynplan" style={{ height: 32, mixBlendMode: 'screen', marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: '#475569' }}>Planejamento Inteligente para construção civil</p>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['Entrar', '/login'], ['Cadastrar', '/cadastro'], ['Planos', '#planos']].map(([label, href]) => (
              <button key={label} onClick={() => href.startsWith('#') ? scrollTo(href.slice(1)) : router.push(href)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#d4a843')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >{label}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#334155' }}>© 2026 Zynplan · Todos os direitos reservados</p>
        </div>
      </footer>

    </div>
  )
}