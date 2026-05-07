import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSocket, { getSocket } from '../hooks/useSocket'
import useGameStore from '../store/useGameStore'
import BoutonRetour from '../components/layout/BoutonRetour'
import { useLangue } from '../hooks/useLangue'
import { SERVER_URL } from '../config/config'
import { palette as C } from '../styles/palette'

// ─── Vue principale ────────────────────────────────────────────────────────────

function VueAccueil({ onCreer, onRejoindre, isLoading }) {
  const navigate = useNavigate()
  const { t } = useLangue()
  const r = t.reseau
  const [prenomCreateur, setPrenomCreateur] = useState('')
  const [prenomRejoignant, setPrenomRejoignant] = useState('')
  const [codeInput, setCodeInput] = useState(['', '', '', ''])
  const [focusCreer, setFocusCreer] = useState(false)
  const [focusRejoindre, setFocusRejoindre] = useState(false)
  const [focusCode, setFocusCode] = useState(null)
  const inputsRef = useRef([])

  function handleCodeInput(i, val) {
    const v = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1)
    const next = [...codeInput]
    next[i] = v
    setCodeInput(next)
    if (v && i < 3) inputsRef.current[i + 1]?.focus()
  }

  function handleCodeKeyDown(i, e) {
    if (e.key === 'Backspace' && !codeInput[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    const next = ['', '', '', '']
    text.split('').forEach((c, i) => { next[i] = c })
    setCodeInput(next)
    inputsRef.current[Math.min(text.length, 3)]?.focus()
    e.preventDefault()
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <BoutonRetour onClick={() => navigate('/')} />
      <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f1f5f9', marginBottom: 6, textAlign: 'center' }}>
        {r.titre}
      </h1>
      <p style={{ color: C.textSub, fontSize: 14, marginBottom: 40, textAlign: 'center' }}>
        {r.sous}
      </p>

      <div style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 720 }}>

        {/* ── Créer une partie ── */}
        <div style={{ flex: 1, background: C.card, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', flexShrink: 0 }}>+</div>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>{r.creer}</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>Tu seras l'hôte de la partie</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div>
            <label style={{ color: C.textSub, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              {r.prenom}
            </label>
            <input
              style={{ width: '100%', background: C.inputBg, border: `1px solid ${focusCreer ? C.inputFocus : C.inputBorder}`, borderRadius: 10, padding: '10px 12px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              placeholder={r.prenom_placeholder}
              value={prenomCreateur}
              onChange={e => setPrenomCreateur(e.target.value)}
              onFocus={() => setFocusCreer(true)}
              onBlur={() => setFocusCreer(false)}
              onKeyDown={e => e.key === 'Enter' && prenomCreateur.trim() && onCreer(prenomCreateur.trim())}
            />
          </div>

          <button
            onClick={() => !isLoading && prenomCreateur.trim() && onCreer(prenomCreateur.trim())}
            style={{ width: '100%', background: isLoading || !prenomCreateur.trim() ? '#4c4580' : C.violet, color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontWeight: 600, fontSize: 15, cursor: isLoading || !prenomCreateur.trim() ? 'default' : 'pointer', opacity: isLoading ? 0.7 : 1, transition: 'background 0.2s' }}
            onMouseEnter={e => { if (!isLoading && prenomCreateur.trim()) e.currentTarget.style.background = C.violetHover }}
            onMouseLeave={e => { if (!isLoading && prenomCreateur.trim()) e.currentTarget.style.background = C.violet }}
          >
            {isLoading ? 'Création…' : r.creer_btn}
          </button>
        </div>

        {/* ── Rejoindre une partie ── */}
        <div style={{ flex: 1, background: C.card, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>{r.rejoindre}</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>Entre le code donné par ton ami</div>
            </div>
          </div>

          <div>
            <label style={{ color: C.textSub, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              {r.prenom}
            </label>
            <input
              style={{ width: '100%', background: C.inputBg, border: `1px solid ${focusRejoindre ? C.inputFocus : C.inputBorder}`, borderRadius: 10, padding: '10px 12px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              placeholder="Bob"
              value={prenomRejoignant}
              onChange={e => setPrenomRejoignant(e.target.value)}
              onFocus={() => setFocusRejoindre(true)}
              onBlur={() => setFocusRejoindre(false)}
            />
          </div>

          <div>
            <p style={{ color: C.textSub, fontSize: 12, textAlign: 'center', marginBottom: 10 }}>{r.code_label}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {codeInput.map((c, i) => (
                <input
                  key={i}
                  ref={el => inputsRef.current[i] = el}
                  maxLength={1}
                  value={c}
                  onChange={e => handleCodeInput(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  onFocus={() => setFocusCode(i)}
                  onBlur={() => setFocusCode(null)}
                  style={{ width: 48, height: 52, background: '#0d1526', border: `1.5px solid ${focusCode === i ? C.inputFocus : '#2d3748'}`, borderRadius: 10, color: '#f1f5f9', fontSize: 22, fontWeight: 700, textAlign: 'center', outline: 'none', textTransform: 'uppercase', transition: 'border-color 0.15s' }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (isLoading) return
              const code = codeInput.join('')
              if (code.length === 4 && prenomRejoignant.trim()) onRejoindre(prenomRejoignant.trim(), code)
            }}
            style={{ width: '100%', background: isLoading ? '#4c4580' : C.violet, color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontWeight: 600, fontSize: 15, cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.7 : 1, transition: 'background 0.2s' }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = C.violetHover }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = C.violet }}
          >
            {isLoading ? 'Connexion…' : r.rejoindre_btn}
          </button>
        </div>
      </div>

      <p style={{ color: C.textMuted, fontSize: 12, marginTop: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        {r.info_wifi}
      </p>
    </div>
  )
}

// ─── Salle d'attente ───────────────────────────────────────────────────────────

function SalleAttente({ code, prenom, onAnnuler }) {
  const navigate = useNavigate()
  const { t } = useLangue()
  const r = t.reseau

  function handleAnnuler() {
    getSocket().emit('quitter')
    onAnnuler()
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>{r.salle_titre}</h1>
      <p style={{ color: C.textSub, fontSize: 14, marginBottom: 28 }}>{r.salle_sous}</p>

      <div style={{ border: '2px dashed #334155', borderRadius: 20, padding: '20px 48px', marginBottom: 28, textAlign: 'center' }}>
        <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 10 }}>{r.code_label}</p>
        <div style={{ display: 'flex', gap: 18 }}>
          {code.split('').map((c, i) => (
            <span key={i} style={{ fontSize: 36, fontWeight: 800, color: C.violetLight, letterSpacing: 2 }}>{c}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.card, border: `2px solid ${C.green}`, borderRadius: 16, padding: '16px 20px', textAlign: 'center', width: 120 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </div>
          <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{prenom || 'Joueur 1'}</p>
          <p style={{ color: C.green, fontSize: 11 }}>{r.connecte}</p>
        </div>

        <div style={{ background: C.card, border: `1.5px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 20px', textAlign: 'center', width: 120 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: '#94a3b8', fontWeight: 700, fontSize: 18 }}>?</div>
          <p style={{ color: C.textSub, fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{r.joueur2}</p>
          <p style={{ color: C.textMuted, fontSize: 11 }}>{r.attente}</p>
        </div>
      </div>

      <p style={{ color: C.textSub, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.textSub, display: 'inline-block' }} />
        {r.attente_msg}
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleAnnuler}
          style={{ background: C.card, color: '#f1f5f9', border: `1.5px solid ${C.cardBorder}`, borderRadius: 14, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#334155'}
          onMouseLeave={e => e.currentTarget.style.background = C.card}
        >
          <span style={{ fontSize: 16 }}>✕</span> {r.annuler}
        </button>
        <button
          onClick={() => navigate('/')}
          style={{ background: C.card, color: C.textSub, border: `1.5px solid ${C.cardBorder}`, borderRadius: 14, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#334155'}
          onMouseLeave={e => e.currentTarget.style.background = C.card}
        >
          <span>←</span> {t.menu}
        </button>
      </div>
    </div>
  )
}

// ─── Écran d'erreur ────────────────────────────────────────────────────────────

function EcranErreur({ onReessayer, onRetour }) {
  const { t } = useLangue()
  const r = t.reseau
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 16 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.redBg, border: `2px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{r.erreur_titre}</h1>
      <p style={{ color: C.textSub, fontSize: 14, textAlign: 'center', maxWidth: 280 }}>
        {r.erreur_sous}
      </p>

      <span style={{ background: 'rgba(127,29,29,0.5)', color: '#fca5a5', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, padding: '5px 14px', borderRadius: 99, border: '1px solid #7f1d1d', letterSpacing: 1 }}>
        ERR_ROOM_NOT_FOUND
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 8 }}>
        <button onClick={onReessayer} style={{ background: C.violet, color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = C.violetHover}
          onMouseLeave={e => e.currentTarget.style.background = C.violet}>
          <span style={{ fontSize: 18 }}>↺</span> {r.reessayer}
        </button>
        <button onClick={onRetour} style={{ background: C.card, color: '#f1f5f9', border: `1.5px solid ${C.cardBorder}`, borderRadius: 14, padding: '13px', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#334155'}
          onMouseLeave={e => e.currentTarget.style.background = C.card}>
          <span>←</span> {t.retour}
        </button>
      </div>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function Reseau() {
  const navigate   = useNavigate()
  const socket     = useSocket()
  const { setMaCouleur, reinitialiser, setPrenomJoueur } = useGameStore()

  const [vue, setVue]             = useState('accueil')
  const [codePartie, setCodePartie] = useState('')
  const [prenomHote, setPrenomHote] = useState('')
  const [isLoading, setIsLoading]   = useState(false)

  // Navigation automatique quand la partie démarre
  useEffect(() => {
    const s = getSocket()
    const handler = () => navigate('/jeu')
    s.on('partie_demarree', handler)
    return () => s.off('partie_demarree', handler)
  }, [])

  async function handleCreer(prenom) {
    if (isLoading) return
    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const res  = await fetch(`${SERVER_URL}/parties`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prenom }),
        signal:  controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      const code = data.code

      // 2. Préparer le store AVANT d'émettre
      reinitialiser()
      setMaCouleur('clair')
      setPrenomJoueur(prenom)

      // 3. Se connecter à la room via Socket.io
      socket.emit('rejoindre', { code, prenom })
      setCodePartie(code)
      setPrenomHote(prenom)
      setVue('attente')

    } catch {
      setVue('erreur')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRejoindre(prenom, code) {
    if (isLoading) return
    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const res  = await fetch(`${SERVER_URL}/parties/${code}`, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) { setVue('erreur'); return }

      const data = await res.json()
      if (data.pleine) { setVue('erreur'); return }

      // 2. Préparer le store AVANT d'émettre
      reinitialiser()
      setMaCouleur('fonce')
      setPrenomJoueur(prenom)

      // 3. Rejoindre la room via Socket.io
      socket.emit('rejoindre', { code, prenom })

    } catch {
      setVue('erreur')
    } finally {
      setIsLoading(false)
    }
  }

  if (vue === 'attente') return <SalleAttente code={codePartie} prenom={prenomHote} onAnnuler={() => setVue('accueil')} />
  if (vue === 'erreur')  return <EcranErreur  onReessayer={() => setVue('accueil')} onRetour={() => setVue('accueil')} />

  return <VueAccueil onCreer={handleCreer} onRejoindre={handleRejoindre} isLoading={isLoading} />
}
