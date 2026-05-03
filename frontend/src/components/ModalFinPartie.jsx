import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/useGameStore'
import { Trophy, Frown, Star, RotateCcw, Home, UserX } from 'lucide-react'

export default function ModalFinPartie({ gagnant, duree }) {
  const navigate = useNavigate()
  const { reinitialiser, prenomJoueur, codeRoom } = useGameStore()
  const [forfaitAccepte, setForfaitAccepte] = useState(false)

  const estForfait = !!gagnant?.forfait && !forfaitAccepte
  const aGagne     = !!gagnant?.forfait || gagnant?.nom === prenomJoueur

  function rejouer() {
    const etaitReseau = !!codeRoom
    reinitialiser()
    if (etaitReseau) navigate('/reseau')
  }

  function menu() {
    reinitialiser()
    navigate('/')
  }

  // ── Écran adversaire déconnecté ─────────────────────────────────────────────
  if (estForfait) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>

          <div style={{ ...styles.emoji, background: 'rgba(127,29,29,0.4)', border: '2px solid #991b1b' }}>
            <UserX size={48} color="#ef4444" />
          </div>

          <h2 style={{ ...styles.titre, color: '#ef4444' }}>
            Adversaire déconnecté
          </h2>

          <p style={styles.sous}>
            Ton adversaire a quitté la partie.<br />Tu remportes la victoire par forfait !
          </p>

          <span style={styles.badge}>OPPONENT_DISCONNECTED</span>

          <button style={styles.btnVictoire} onClick={() => setForfaitAccepte(true)}>
            ✓ Accepter la victoire
          </button>
          <button style={styles.btnMenu} onClick={menu}>
            <Home size={18} /> Menu principal
          </button>

        </div>
      </div>
    )
  }

  // ── Écran victoire / défaite normal ─────────────────────────────────────────
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        <div style={styles.emoji}>
          {aGagne ? <Trophy size={48} color="#f59e0b" /> : <Frown size={48} color="#94a3b8" />}
        </div>

        <div style={styles.etoiles}>
          {[1,2,3].map(i => (
            <Star
              key={i}
              size={28}
              fill={aGagne ? '#f59e0b' : 'transparent'}
              color={aGagne ? '#f59e0b' : '#475569'}
            />
          ))}
        </div>

        <h2 style={{ ...styles.titre, color: aGagne ? '#a78bfa' : '#fff' }}>
          {aGagne ? 'Tu as gagné !' : 'Tu as perdu...'}
        </h2>

        <p style={styles.sous}>
          {aGagne
            ? 'Félicitations, tu as formé un carré parfait !'
            : 'Ton adversaire a formé un carré parfait.'}
        </p>

        <div style={styles.dureeBox}>
          <span style={styles.dureeLabel}>Durée de la partie</span>
          <span style={styles.dureeVal}>{duree || '--:--'}</span>
        </div>

        <button style={styles.btnRejouer} onClick={rejouer}>
          <RotateCcw size={18} /> Rejouer
        </button>
        <button style={styles.btnMenu} onClick={menu}>
          <Home size={18} /> Menu principal
        </button>

      </div>
    </div>
  )
}

const styles = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:      { background: '#1e293b', borderRadius: 20, padding: '2.5rem 2rem', width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  emoji:      { background: '#0f172a', borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  etoiles:    { display: 'flex', gap: 8 },
  titre:      { fontSize: 24, fontWeight: 700, margin: 0 },
  sous:       { color: '#94a3b8', fontSize: 13, textAlign: 'center', margin: 0 },
  badge:      { background: 'rgba(127,29,29,0.5)', color: '#fca5a5', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, padding: '5px 14px', borderRadius: 99, border: '1px solid #7f1d1d', letterSpacing: 1 },
  dureeBox:   { background: '#0f172a', borderRadius: 10, padding: '10px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  dureeLabel: { color: '#64748b', fontSize: 11 },
  dureeVal:   { color: '#fff', fontSize: 22, fontWeight: 700 },
  btnRejouer: { width: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnVictoire:{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnMenu:    { width: '100%', background: '#334155', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
}
