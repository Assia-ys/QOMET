import { useNavigate } from 'react-router-dom'
import BoutonRetour from '../../components/layout/BoutonRetour'
import BoutonMenu from '../../components/layout/BoutonMenu'
import { useTranslation } from 'react-i18next'
import { palette as C } from '../../styles/palette'
import { styles, btnPrimaryStyle } from '../../styles/pages/Reseau/EcranErreur.styles'

export default function EcranErreur({ onReessayer, onRetour, codeInvalide = false }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div style={styles.page}>
      <BoutonRetour onClick={onRetour} />

      <div style={styles.icon}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>

      <h1 style={styles.titre}>{codeInvalide ? t('reseau.code_invalide_titre') : t('reseau.erreur_titre')}</h1>
      <p style={styles.sous}>{codeInvalide ? t('reseau.code_invalide_sous') : t('reseau.erreur_sous')}</p>
      <span style={styles.badge}>{codeInvalide ? 'ERR_INVALID_CODE' : 'ERR_ROOM_NOT_FOUND'}</span>

      <div style={styles.actions}>
        <button
          style={btnPrimaryStyle()}
          onClick={onReessayer}
          onMouseEnter={e => e.currentTarget.style.background = C.violetHover}
          onMouseLeave={e => e.currentTarget.style.background = C.violet}
        >
          <span style={{ fontSize: 18 }}>&#8635;</span> {t('reseau.reessayer')}
        </button>
        <BoutonMenu onClick={() => navigate('/')} fullWidth />
      </div>
    </div>
  )
}