import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BoutonRetour from '../../components/layout/BoutonRetour'
import { useLangue } from '../../hooks/useLangue'
import { palette as C } from '../../styles/palette'
import { styles, inputStyle, codeInputStyle, primaryButtonStyle, modeTabStyle } from '../../styles/pages/Reseau/VueAccueil.styles'
import { LOCAL_URL, ONLINE_URL } from '../../config/config'

export default function VueAccueil({ onCreer, onRejoindre, isLoading }) {
  const navigate        = useNavigate()
  const { t }           = useLangue()
  const r               = t.reseau
  const [onglet, setOnglet] = useState('local')

  if (onglet === 'online') {
    return (
      <div style={styles.page}>
        <BoutonRetour onClick={() => navigate('/')} />
        <h1 style={styles.titre}>{r.titre}</h1>

        <div style={{ display: 'flex', gap: 4, background: C.card, borderRadius: 10, padding: 4, marginBottom: 32, width: '100%', maxWidth: 300 }}>
          <button style={modeTabStyle(false)} onClick={() => setOnglet('local')}>🖧 {r.mode_local}</button>
          <button style={modeTabStyle(true)}>🌐 {r.mode_online}</button>
        </div>

        <div style={{ background: C.card, borderRadius: 20, padding: 40, maxWidth: 380, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🌐</div>
          <h2 style={{ color: C.textPrimary, fontSize: 20, fontWeight: 700, margin: 0 }}>Jouer en ligne</h2>
          <p style={{ color: C.textSub, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Joue avec n'importe qui, depuis n'importe quel réseau.<br/>
            Aucune configuration requise.
          </p>
          <button
            style={{ ...primaryButtonStyle(false), marginTop: 4 }}
            onClick={() => window.electronAPI?.ouvrirURL
            ? window.electronAPI.ouvrirURL(ONLINE_URL)
            : window.open(ONLINE_URL, '_blank')
          }
            onMouseEnter={e => { e.currentTarget.style.background = C.violetHover }}
            onMouseLeave={e => { e.currentTarget.style.background = C.violet }}
          >
            🌐 Accéder au jeu en ligne
          </button>
          <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>{ONLINE_URL}</p>
        </div>
      </div>
    )
  }

  return <VueLocal r={r} navigate={navigate} onCreer={onCreer} onRejoindre={onRejoindre} isLoading={isLoading} onSwitchOnline={() => setOnglet('online')} />
}

function VueLocal({ r, navigate, onCreer, onRejoindre, isLoading, onSwitchOnline }) {
  const [prenomCreateur,   setPrenomCreateur]   = useState('')
  const [prenomRejoignant, setPrenomRejoignant] = useState('')
  const [codeInput,        setCodeInput]        = useState(['', '', '', ''])
  const [ipHote,           setIpHote]           = useState('')
  const [focusCreer,       setFocusCreer]       = useState(false)
  const [focusRejoindre,   setFocusRejoindre]   = useState(false)
  const [focusCode,        setFocusCode]        = useState(null)
  const [focusIP,          setFocusIP]          = useState(false)
  const [showManualIP,     setShowManualIP]      = useState(false)

  const isElectron = !!window.electronAPI
  const inputsRef = useRef([])

  function handleCodeInput(i, val) {
    const v    = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1)
    const next = [...codeInput]
    next[i] = v
    setCodeInput(next)
    if (v && i < 3) inputsRef.current[i + 1]?.focus()
  }

  function handleCodeKeyDown(i, e) {
    if (e.key === 'Backspace' && !codeInput[i] && i > 0) inputsRef.current[i - 1]?.focus()
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    const next = ['', '', '', '']
    text.split('').forEach((ch, i) => { next[i] = ch })
    setCodeInput(next)
    inputsRef.current[Math.min(text.length, 3)]?.focus()
    e.preventDefault()
  }

  const serverURL         = ipHote.trim() ? `http://${ipHote.trim()}:7777` : LOCAL_URL
  const codeSaisi         = codeInput.join('')
  const disabledCreer     = isLoading || !prenomCreateur.trim()
  const disabledRejoindre = isLoading || codeSaisi.length < 4 || !prenomRejoignant.trim()

  return (
    <div style={styles.page}>
      <BoutonRetour onClick={() => navigate('/')} />
      <h1 style={styles.titre}>{r.titre}</h1>
      <p style={styles.sous}>{r.sous}</p>

      <div style={{ display: 'flex', gap: 4, background: C.card, borderRadius: 10, padding: 4, marginBottom: 28, width: '100%', maxWidth: 300 }}>
        <button style={modeTabStyle(true)}>🖧 {r.mode_local}</button>
        <button style={modeTabStyle(false)} onClick={onSwitchOnline}>🌐 {r.mode_online}</button>
      </div>

      <div style={styles.cardsRow}>

        {/* ── Créer ── */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardAvatar}>+</div>
            <div>
              <div style={styles.cardTitre}>{r.creer}</div>
              <div style={styles.cardSous}>Tu seras l'hôte de la partie</div>
            </div>
          </div>
          <div style={styles.spacer} />
          <div>
            <label style={styles.label}><PersonIcon /> {r.prenom}</label>
            <input
              style={inputStyle(focusCreer)}
              placeholder={r.prenom_placeholder}
              value={prenomCreateur}
              onChange={e => setPrenomCreateur(e.target.value)}
              onFocus={() => setFocusCreer(true)}
              onBlur={() => setFocusCreer(false)}
              onKeyDown={e => e.key === 'Enter' && !disabledCreer && onCreer(prenomCreateur.trim(), LOCAL_URL)}
            />
          </div>
          <button
            style={primaryButtonStyle(disabledCreer)}
            onClick={() => !disabledCreer && onCreer(prenomCreateur.trim(), LOCAL_URL)}
            onMouseEnter={e => { if (!disabledCreer) e.currentTarget.style.background = C.violetHover }}
            onMouseLeave={e => { if (!disabledCreer) e.currentTarget.style.background = C.violet }}
          >
            {isLoading ? 'Création…' : r.creer_btn}
          </button>
        </div>

        {/* ── Rejoindre ── */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardSearchAvatar}><SearchIcon /></div>
            <div>
              <div style={styles.cardTitre}>{r.rejoindre}</div>
              <div style={styles.cardSous}>Entre le code donné par ton ami</div>
            </div>
          </div>

          <div>
            <label style={styles.label}><PersonIcon /> {r.prenom}</label>
            <input
              style={inputStyle(focusRejoindre)}
              placeholder="Bob"
              value={prenomRejoignant}
              onChange={e => setPrenomRejoignant(e.target.value)}
              onFocus={() => setFocusRejoindre(true)}
              onBlur={() => setFocusRejoindre(false)}
            />
          </div>

          {(!isElectron || showManualIP) && (
            <div>
              <label style={styles.label}><NetworkIcon /> {r.ip_manuelle}</label>
              <input
                style={inputStyle(focusIP)}
                placeholder={r.ip_placeholder}
                value={ipHote}
                onChange={e => setIpHote(e.target.value)}
                onFocus={() => setFocusIP(true)}
                onBlur={() => setFocusIP(false)}
              />
              <p style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>
                Laisser vide si même machine
              </p>
            </div>
          )}
          {isElectron && !showManualIP && (
            <p
              style={{ color: C.textMuted, fontSize: 11, textAlign: 'center', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setShowManualIP(true)}
            >
              Saisir l'IP manuellement
            </p>
          )}

          <div>
            <p style={styles.codeLabel}>{r.code_label}</p>
            <div style={styles.codeRow}>
              {codeInput.map((ch, i) => (
                <input
                  key={i}
                  ref={el => inputsRef.current[i] = el}
                  maxLength={1}
                  value={ch}
                  onChange={e => handleCodeInput(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  onFocus={() => setFocusCode(i)}
                  onBlur={() => setFocusCode(null)}
                  style={codeInputStyle(focusCode === i)}
                />
              ))}
            </div>
          </div>

          <button
            style={primaryButtonStyle(disabledRejoindre)}
            onClick={() => !disabledRejoindre && onRejoindre(prenomRejoignant.trim(), codeSaisi, serverURL)}
            onMouseEnter={e => { if (!disabledRejoindre) e.currentTarget.style.background = C.violetHover }}
            onMouseLeave={e => { if (!disabledRejoindre) e.currentTarget.style.background = C.violet }}
          >
            {isLoading ? 'Connexion…' : r.rejoindre_btn}
          </button>
        </div>

      </div>

      <p style={styles.footer}><WifiIcon /> {r.info_wifi}</p>
    </div>
  )
}

function PersonIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
}
function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
}
function NetworkIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="6" height="6" rx="1"/><rect x="16" y="2" width="6" height="6" rx="1"/><rect x="9" y="16" width="6" height="6" rx="1"/><path d="M5 8v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
}
function WifiIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
}
