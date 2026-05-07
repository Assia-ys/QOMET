import { palette } from '../../palette'
import { radius } from '../../theme'

export const styles = {
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
