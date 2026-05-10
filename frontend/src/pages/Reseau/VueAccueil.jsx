import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BoutonRetour from '../../components/layout/BoutonRetour'
import { useLangue } from '../../hooks/useLangue'
import { palette as C } from '../../styles/palette'
import { styles, inputStyle, codeInputStyle, primaryButtonStyle } from '../../styles/pages/Reseau/VueAccueil.styles'

export default function VueAccueil({ onCreer, onRejoindre, isLoading }) {
  const navigate = useNavigate()
  const { t }    = useLangue()
  const r        = t.reseau

  const [prenomCreateur,   setPrenomCreateur]   = useState('')
  const [prenomRejoignant, setPrenomRejoignant] = useState('')
  const [codeInput,        setCodeInput]        = useState(['', '', '', ''])
  const [focusCreer,       setFocusCreer]       = useState(false)
  const [focusRejoindre,   setFocusRejoindre]   = useState(false)
  const [focusCode,        setFocusCode]        = useState(null)

  // ── Découverte réseau ──────────────────────────────────────────────────────
  const [scanning,         setScanning]         = useState(false)
  const [serveurs,         setServeurs]          = useState([])
  const [serveurChoisi,    setServeurChoisi]     = useState(null) // { ip, hostname }
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI

  async function lancerScan() {
    setScanning(true)
    setServeurs([])
    setServeurChoisi(null)
    try {
      const resultats = await window.electronAPI.scanReseau()
      setServeurs(resultats || [])
    } catch (e) {
      console.error('Scan échoué:', e)
    }
    setScanning(false)
  }

  function choisirServeur(s) {
    setServeurChoisi(s)
    localStorage.setItem('qomet_server_ip', s.ip)
  }

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

  const codeSaisi = codeInput.join('')
  const disabledCreer     = isLoading || !prenomCreateur.trim()
  const disabledRejoindre = isLoading || codeSaisi.length < 4 || !prenomRejoignant.trim()

  function handleRejoindre() {
    if (disabledRejoindre) return
    const serverURL = serveurChoisi
      ? `http://${serveurChoisi.ip}:7777`
      : 'http://127.0.0.1:7777'
    // Remettre à zéro si même machine
    if (!serveurChoisi) localStorage.removeItem('qomet_server_ip')
    onRejoindre(prenomRejoignant.trim(), codeSaisi, serverURL)
  }

  return (
    <div style={styles.page}>
      <BoutonRetour onClick={() => navigate('/')} />
      <h1 style={styles.titre}>{r.titre}</h1>
      <p style={styles.sous}>{r.sous}</p>

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
              onKeyDown={e => e.key === 'Enter' && !disabledCreer && onCreer(prenomCreateur.trim())}
            />
          </div>
          <button
            style={primaryButtonStyle(disabledCreer)}
            onClick={() => !disabledCreer && onCreer(prenomCreateur.trim())}
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

          {/* ── Découverte réseau (Electron uniquement) ── */}
          {isElectron && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: C.textSub, fontSize: 12 }}>Serveur hôte</span>
                <button
                  onClick={lancerScan}
                  disabled={scanning}
                  style={{ background: 'transparent', border: `1px solid ${C.cardBorder}`, color: C.textSub, borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}
                >
                  {scanning ? '⟳ Recherche...' : '🔍 Rechercher'}
                </button>
              </div>

              {/* Liste des serveurs trouvés */}
              {serveurs.length > 0 && (
                <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                  {serveurs.map(s => (
                    <div
                      key={s.ip}
                      onClick={() => choisirServeur(s)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                        background: serveurChoisi?.ip === s.ip ? C.violet + '33' : C.card,
                        borderLeft: `3px solid ${serveurChoisi?.ip === s.ip ? C.violet : 'transparent'}`,
                        color: C.textPrimary, display: 'flex', justifyContent: 'space-between',
                      }}
                    >
                      <span>🟢 {s.hostname}</span>
                      <span style={{ color: C.textMuted, fontSize: 11 }}>{s.ip}</span>
                    </div>
                  ))}
                </div>
              )}

              {serveurs.length === 0 && !scanning && (
                <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 6 }}>
                  {serveurChoisi
                    ? `✅ ${serveurChoisi.hostname} (${serveurChoisi.ip})`
                    : 'Même machine ou cliquer Rechercher'}
                </p>
              )}
            </div>
          )}

          {/* ── Code obligatoire ── */}
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
            onClick={handleRejoindre}
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
function WifiIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
}
