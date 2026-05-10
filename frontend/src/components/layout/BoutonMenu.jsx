import { useState } from 'react'
import { Home } from 'lucide-react'
import { useLangue } from '../../hooks/useLangue'
import { boutonMenuStyle } from '../../styles/components/layout/BoutonMenu.styles'

export default function BoutonMenu({ onClick, label, fullWidth = false, taille = 'normal' }) {
  const { t }    = useLangue()
  const texte    = label ?? t.menu
  const petit    = taille === 'petit'
  const [survol, setSurvol] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={boutonMenuStyle(survol, fullWidth, petit)}
    >
      <Home size={petit ? 14 : 18} />
      {texte}
    </button>
  )
}
