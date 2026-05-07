import { palette } from '../../styles/palette'
import { radius } from '../../styles/theme'

/**
 * Modale générique — overlay sombre + carte centrée.
 * Utiliser comme wrapper : <Modal>...</Modal>
 */
export default function Modal({ children }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.carte}>{children}</div>
    </div>
  )
}

const styles = {
  overlay: {
    position:        'fixed',
    inset:           0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          100,
  },
  carte: {
    backgroundColor: palette.card,
    border:          `1px solid ${palette.cardBorder}`,
    borderRadius:    radius.lg,
    padding:         36,
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    gap:             16,
    minWidth:        320,
    boxShadow:       '0 25px 60px rgba(0,0,0,0.5)',
  },
}
