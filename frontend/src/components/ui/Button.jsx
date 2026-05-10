import { useState } from 'react'
import { buttonStyle, iconeStyle } from '../../styles/components/ui/Button.styles'

export default function Button({ label, couleur = '#7c3aed', onClick, icone, fullWidth = false, disabled = false }) {
  const [survol, setSurvol] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={buttonStyle(couleur, survol, disabled, fullWidth, !!icone)}
    >
      {icone && <span style={iconeStyle}>{icone}</span>}
      {label}
    </button>
  )
}
