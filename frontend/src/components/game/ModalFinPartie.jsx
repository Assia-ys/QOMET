import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../../store/useGameStore'
import { getSocket } from '../../hooks/useSocket'
import { Trophy, Frown, Star, RotateCcw, UserX, Eye } from 'lucide-react'
import BoutonMenu from '../layout/BoutonMenu'
import { useLangue } from '../../hooks/useLangue'

export default function ModalFinPartie({ gagnant, duree }) {
  const navigate = useNavigate()
  const { t } = useLangue()
  const m = t.modal
  const { reinitialiser, prenomJoueur, codeRoom, joueurs } = useGameStore()
  const [forfaitAccepte, setForfaitAccepte] = useState(false)
  const [minimise, setMinimise]             = useState(false)

  const modeIA     = joueurs.some(j => j?.nom === 'IA')
  const estForfait = !!gagnant?.forfait && !forfaitAccepte
  const aGagne     = !!gagnant?.forfait || gagnant?.nom === prenomJoueur

  function rejouer() {
    reinitialiser()
    if (modeIA) navigate('/ia')
    else if (codeRoom) navigate('/reseau')
  }

  function menu() {
    getSocket().emit('abandonner')
    reinitialiser()
    navigate('/')
  }

  if (minimise) {
    return (
      <div style={styles.barre}>
        <span style={{ color: aGagne ? '#a78bfa' : '#94a3b8', fontWeight: 700, fontSize: 14 }}>
          {aGagne ? `🏆 ${m.gagne}` : `😔 ${m.perdu}`}
        </span>
        <button style={styles.btnBarre} onClick={() => setMinimise(false)}>
          {m.voir_resultat}
        </button>
        <button style={{ background: '#374151', color: '#94a3b8', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }} onClick={rejouer}>
          <RotateCcw size={14} /> {m.rejouer}
        </button>
        <BoutonMenu onClick={menu} taille="petit" />
      </div>
    )
  }

  if (estForfait) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={{ ...styles.emoji, background: 'rgba(127,29,29,0.4)', border: '2px solid #991b1b' }}>
            <UserX size={48} color="#ef4444" />
          </div>
          <h2 style={{ ...styles.titre, color: '#ef4444' }}>{m.adversaire_deco}</h2>
          <p style={styles.sous}>
            {m.adversaire_msg.split('\n')[0]}<br />{m.adversaire_msg.split('\n')[1]}
          </p>
          <span style={styles.badge}>OPPONENT_DISCONNECTED</span>
          <button style={styles.btnVictoire} onClick={() => setForfaitAccepte(true)}>
            {m.accepter}
          </button>
          <BoutonMenu onClick={menu} fullWidth />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        <button style={styles.btnFermer} onClick={() => setMinimise(true)} title={m.voir_plateau}>
          <Eye size={16} /> {m.voir_plateau}
        </button>

        <div style={styles.emoji}>
          {aGagne ? <Trophy size={48} color="#f59e0b" /> : <Frown size={48} color="#94a3b8" />}
        </div>

        <div style={styles.etoiles}>
          {[1,2,3].map(i => (
            <Star key={i} size={28}
              fill={aGagne ? '#f59e0b' : 'transparent'}
              color={aGagne ? '#f59e0b' : '#475569'}
            />
          ))}
        </div>

        <h2 style={{ ...styles.titre, color: aGagne ? '#a78bfa' : '#fff' }}>
          {aGagne ? m.gagne : m.perdu}
        </h2>

        <p style={styles.sous}>
          {aGagne ? m.gagne_msg : m.perdu_msg}
        </p>

        <div style={styles.dureeBox}>
          <span style={styles.dureeLabel}>{m.duree}</span>
          <span style={styles.dureeVal}>{duree || '--:--'}</span>
        </div>

        <button style={styles.btnRejouer} onClick={rejouer}>
          <RotateCcw size={18} /> {m.rejouer}
        </button>
        <BoutonMenu onClick={menu} fullWidth />

      </div>
    </div>
  )
}

const styles = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:      { position: 'relative', background: '#1e293b', borderRadius: 20, padding: '2.5rem 2rem', width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  btnFermer:  { position: 'absolute', top: 12, right: 12, background: '#334155', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' },
  emoji:      { background: '#0f172a', borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  etoiles:    { display: 'flex', gap: 8 },
  titre:      { fontSize: 24, fontWeight: 700, margin: 0, textAlign: 'center' },
  sous:       { color: '#94a3b8', fontSize: 13, textAlign: 'center', margin: 0 },
  badge:      { background: 'rgba(127,29,29,0.5)', color: '#fca5a5', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, padding: '5px 14px', borderRadius: 99, border: '1px solid #7f1d1d', letterSpacing: 1 },
  dureeBox:   { background: '#0f172a', borderRadius: 10, padding: '10px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  dureeLabel: { color: '#64748b', fontSize: 11 },
  dureeVal:   { color: '#fff', fontSize: 22, fontWeight: 700 },
  btnRejouer: { width: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnVictoire:{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  barre:      { position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 100, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' },
  btnBarre:   { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}
