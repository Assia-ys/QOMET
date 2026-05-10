import { useState } from 'react'
import { useLangue } from '../../hooks/useLangue'
import { boutonRetourStyle } from '../../styles/components/layout/BoutonRetour.styles'

export default function BoutonRetour({ onClick, label }) {
  const { t }    = useLangue()
  const texte    = label ?? t.retour
  const [survol, setSurvol] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={boutonRetourStyle(survol)}
    >
      {texte}
    </button>
  )
}
