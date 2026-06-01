import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../../store/useGameStore'
import { getSocket } from '../../hooks/useSocket'
import { Trophy, Frown, Star, RotateCcw, UserX, Eye } from 'lucide-react'
import BoutonMenu from '../layout/BoutonMenu'
import { useTranslation } from 'react-i18next'
import { palette } from '../../styles/palette'
import { styles, titreDynStyle, forfaitEmojiStyle } from '../../styles/components/game/ModalFinPartie.styles'

export default function ModalFinPartie({ gagnant, duree }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { reinitialiser, prenomJoueur, codeRoom, joueurs } = useGameStore()
  const [forfaitAccepte, setForfaitAccepte] = useState(false)
  const [minimise,       setMinimise]       = useState(false)

  const modeIA     = joueurs.some(j => j?.nom === 'IA')
  const estForfait = !!gagnant?.forfait && !forfaitAccepte
  const aGagne     = !!gagnant?.forfait || gagnant?.nom === prenomJoueur

  function rejouer() {
    reinitialiser()
    navigate(modeIA ? '/ia' : '/reseau')
  }

  function menu() {
    getSocket().emit('abandonner')
    reinitialiser()
    navigate('/')
  }

  if (minimise) {
    return (
      <div style={styles.barre}>
        <span style={aGagne ? styles.barreGagnant : styles.barrePerdu}>
          {aGagne ? t('modal.gagne') : t('modal.perdu')}
        </span>
        <button style={styles.btnBarre} onClick={() => setMinimise(false)}>
          {t('modal.voir_resultat')}
        </button>
        <button style={styles.btnBarreSecondaire} onClick={rejouer}>
          <RotateCcw size={14} /> {t('modal.rejouer')}
        </button>
        <BoutonMenu onClick={menu} taille="petit" />
      </div>
    )
  }

  if (estForfait) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={forfaitEmojiStyle()}>
            <UserX size={48} color={palette.red} />
          </div>
          <h2 style={{ ...titreDynStyle(false), color: palette.red }}>{t('modal.adversaire_deco')}</h2>
          <p style={styles.sous}>
            {t('modal.adversaire_msg').split('\n')[0]}<br />{t('modal.adversaire_msg').split('\n')[1]}
          </p>
          <span style={styles.badge}>OPPONENT_DISCONNECTED</span>
          <button style={styles.btnVictoire} onClick={() => setForfaitAccepte(true)}>
            {t('modal.accepter')}
          </button>
          <BoutonMenu onClick={menu} fullWidth />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        <button style={styles.btnFermer} onClick={() => setMinimise(true)} title={t('modal.voir_plateau')}>
          <Eye size={16} /> {t('modal.voir_plateau')}
        </button>

        <div style={styles.emoji}>
          {aGagne
            ? <Trophy size={48} color={palette.clair.fill} />
            : <Frown   size={48} color={palette.textSub} />
          }
        </div>

        <div style={styles.etoiles}>
          {[1, 2, 3].map(i => (
            <Star key={i} size={28}
              fill={aGagne ? palette.clair.fill : 'transparent'}
              color={aGagne ? palette.clair.fill : palette.textDisabled}
            />
          ))}
        </div>

        <h2 style={titreDynStyle(aGagne)}>{aGagne ? t('modal.gagne') : t('modal.perdu')}</h2>

        <p style={styles.sous}>{aGagne ? t('modal.gagne_msg') : t('modal.perdu_msg')}</p>

        <div style={styles.dureeBox}>
          <span style={styles.dureeLabel}>{t('modal.duree')}</span>
          <span style={styles.dureeVal}>{duree || '--:--'}</span>
        </div>

        <button style={styles.btnRejouer} onClick={rejouer}>
          <RotateCcw size={18} /> {t('modal.rejouer')}
        </button>
        <BoutonMenu onClick={menu} fullWidth />

      </div>
    </div>
  )
}
