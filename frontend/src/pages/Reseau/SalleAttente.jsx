import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSocket } from '../../hooks/useSocket'
import { useTranslation } from 'react-i18next'
import { palette as C } from '../../styles/palette'
import BoutonMenu from '../../components/layout/BoutonMenu'
import { styles, joueurCardStyle, joueurAvatarStyle, joueurNomStyle, joueurLabelStyle } from '../../styles/pages/Reseau/SalleAttente.styles'

export default function SalleAttente({ code, prenom, onAnnuler, isLocal = false }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [localIP,   setLocalIP]   = useState(null)
  const [showIP,    setShowIP]    = useState(false)

  useEffect(() => {
    if (isLocal && window.electronAPI?.getLocalIP) {
      window.electronAPI.getLocalIP().then(ip => { if (ip) setLocalIP(ip) }).catch(() => {})
    }
  }, [isLocal])

  function handleAnnuler() {
    getSocket().emit('quitter')
    onAnnuler()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>{t('reseau.salle_titre')}</h1>
      <p style={styles.sous}>{t('reseau.salle_sous')}</p>

      <div style={styles.codeBox}>
        <p style={styles.codeLabel}>{t('reseau.code_label')}</p>
        <div style={styles.codeChars}>
          {code.split('').map((ch, i) => (
            <span key={i} style={styles.codeChar}>{ch}</span>
          ))}
        </div>
        {isLocal && localIP && (
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <p
              onClick={() => setShowIP(v => !v)}
              style={{ color: C.textMuted, fontSize: 11, textAlign: 'center', cursor: 'pointer', textDecoration: 'underline', margin: 0 }}
            >
              {showIP ? 'Masquer mon adresse IP' : 'Afficher mon adresse IP'}
            </p>
            {showIP && (
              <p style={{ color: C.textSub, fontSize: 13, textAlign: 'center', margin: '6px 0 0 0', fontFamily: 'monospace' }}>{localIP}</p>
            )}
          </div>
        )}
      </div>

      <div style={styles.joueurs}>
        <JoueurCard nom={prenom || 'Joueur 1'} label={t('reseau.connecte')} connected />
        <JoueurCard nom={t('reseau.joueur2')} label={t('reseau.attente')} connected={false} />
      </div>

      <p style={styles.attente}>
        <span style={styles.attentePoint} />
        {t('reseau.attente_msg')}
      </p>

      <div style={styles.actions}>
        <button
          style={styles.btn}
          onClick={handleAnnuler}
          onMouseEnter={e => e.currentTarget.style.background = C.cardBorder}
          onMouseLeave={e => e.currentTarget.style.background = C.card}
        >
          <span style={{ fontSize: 16 }}>&#10005;</span> {t('reseau.annuler')}
        </button>
        <BoutonMenu onClick={() => { getSocket().emit('quitter'); navigate('/') }} />
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
