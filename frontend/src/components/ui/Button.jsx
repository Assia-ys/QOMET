import { useState } from 'react'

/**
 * Bouton générique avec effet survol.
 * Props :
 *   label    {string}   — texte affiché
 *   couleur  {string}   — couleur de fond (hex)
 *   onClick  {function}
 *   icone    {string}   — emoji optionnel affiché avant le label
 *   fullWidth {bool}    — prend toute la largeur disponible
 *   disabled {bool}
 */
export default function Button({ label, couleur = '#7c3aed', onClick, icone, fullWidth = false, disabled = false }) {
  const [survol, setSurvol] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{
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
        gap:             icone ? 8 : 0,
        opacity:         disabled ? 0.6 : 1,
      }}
    >
      {icone && <span style={{ fontSize: '1.1rem' }}>{icone}</span>}
      {label}
    </button>
  )
}
