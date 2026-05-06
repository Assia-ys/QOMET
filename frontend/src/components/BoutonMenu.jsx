import { useState } from 'react'
import { Home } from 'lucide-react'
import { useLangue } from '../hooks/useLangue'

export default function BoutonMenu({ onClick, label, fullWidth = false, taille = 'normal' }) {
  const { t } = useLangue()
  const texte = label ?? t.menu
  const [survol, setSurvol] = useState(false)
  const petit = taille === 'petit'
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{
        width:          fullWidth ? '100%' : 'auto',
        background:     survol ? '#475569' : '#334155',
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
      }}
    >
      <Home size={petit ? 14 : 18} />
      {texte}
    </button>
  )
}
