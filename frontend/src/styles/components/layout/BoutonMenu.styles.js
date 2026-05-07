import { palette } from '../../palette'

export function boutonMenuStyle(survol, fullWidth, petit) {
  return {
    width:          fullWidth ? '100%' : 'auto',
    background:     survol ? palette.inputBorder : palette.cardBorder,
    color:          '#fff',
    border:         'none',
    borderRadius:   10,
    padding:        petit ? '6px 12px' : '12px',
    fontSize:       petit ? 12 : 15,
    fontWeight:     600,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            petit ? 5 : 8,
    transition:     'background 0.15s',
  }
}
