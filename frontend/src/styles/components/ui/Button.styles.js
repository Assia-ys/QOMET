export function buttonStyle(couleur, survol, disabled, fullWidth, hasIcon) {
  return {
    width:           fullWidth ? '100%' : 'auto',
    padding:         '10px 22px',
    borderRadius:    8,
    border:          'none',
    backgroundColor: disabled ? couleur + '66' : survol ? couleur : couleur + 'cc',
    color:           '#fff',
    fontWeight:      600,
    fontSize:        '0.9rem',
    cursor:          disabled ? 'not-allowed' : 'pointer',
    transition:      'all 0.15s',
    transform:       survol && !disabled ? 'scale(1.03)' : 'scale(1)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             hasIcon ? 8 : 0,
    opacity:         disabled ? 0.6 : 1,
  }
}

export const iconeStyle = { fontSize: '1.1rem' }
