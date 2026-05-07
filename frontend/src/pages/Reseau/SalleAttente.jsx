import { useNavigate } from 'react-router-dom'
import { getSocket } from '../../hooks/useSocket'
import { useLangue } from '../../hooks/useLangue'
import { palette as C } from '../../styles/palette'
import { styles, joueurCardStyle, joueurAvatarStyle, joueurNomStyle, joueurLabelStyle } from '../../styles/pages/Reseau/SalleAttente.styles'

export default function SalleAttente({ code, prenom, onAnnuler }) {
  const navigate = useNavigate()
  const { t }    = useLangue()
  const r        = t.reseau

  function handleAnnuler() {
    getSocket().emit('quitter')
    onAnnuler()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>{r.salle_titre}</h1>
      <p style={styles.sous}>{r.salle_sous}</p>

      <div style={styles.codeBox}>
        <p style={styles.codeLabel}>{r.code_label}</p>
        <div style={styles.codeChars}>
          {code.split('').map((ch, i) => (
            <span key={i} style={styles.codeChar}>{ch}</span>
          ))}
        </div>
      </div>

      <div style={styles.joueurs}>
        <JoueurCard nom={prenom || 'Joueur 1'} label={r.connecte} connected />
        <JoueurCard nom={r.joueur2} label={r.attente} connected={false} />
      </div>

      <p style={styles.attente}>
        <span style={styles.attentePoint} />
        {r.attente_msg}
      </p>

      <div style={styles.actions}>
        <button
          style={styles.btn}
          onClick={handleAnnuler}
          onMouseEnter={e => e.currentTarget.style.background = C.cardBorder}
          onMouseLeave={e => e.currentTarget.style.background = C.card}
        >
          <span style={{ fontSize: 16 }}>&#10005;</span> {r.annuler}
        </button>
        <button
          style={{ ...styles.btn, color: C.textSub }}
          onClick={() => navigate('/')}
          onMouseEnter={e => e.currentTarget.style.background = C.cardBorder}
          onMouseLeave={e => e.currentTarget.style.background = C.card}
        >
          <span>&#8592;</span> {t.menu}
        </button>
      </div>
    </div>
  )
}

function JoueurCard({ nom, label, connected }) {
  return (
    <div style={joueurCardStyle(connected)}>
      <div style={joueurAvatarStyle(connected)}>
        {connected
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          : <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 18 }}>?</span>
        }
      </div>
      <p style={joueurNomStyle(connected)}>{nom}</p>
      <p style={joueurLabelStyle(connected)}>{label}</p>
    </div>
  )
}
