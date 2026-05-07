import { useState } from 'react'
import { useLangue } from '../../hooks/useLangue'

export default function BoutonRetour({ onClick, label }) {
  const { t } = useLangue()
  const texte = label ?? t.retour
  const [survol, setSurvol] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{
        position: 'absolute', top: 24, left: 24,
        background: 'transparent',
        border: `1px solid ${survol ? '#475569' : '#334155'}`,
        borderRadius: 8, padding: '8px 16px',
        color: survol ? '#f1f5f9' : '#94a3b8',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      {texte}
    </button>
  )
}
