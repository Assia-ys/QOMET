import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { boutonRetourStyle } from '../../styles/components/layout/BoutonRetour.styles'

export default function BoutonRetour({ onClick, label }) {
  const { t }    = useTranslation()
  const texte    = label ?? t('retour')
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
