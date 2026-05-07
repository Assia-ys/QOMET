import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLangue } from '../hooks/useLangue'
import { closeApp } from '../config/config'
import Button from '../components/ui/Button'
import { palette } from '../styles/palette'

export default function Home() {
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setChargement(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (chargement) return <EcranChargement />
  return <MenuPrincipal navigate={navigate} />
}

function EcranChargement() {
  const { t } = useLangue()
  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>QOMET</h1>
      <div style={styles.spinner} />
      <p style={styles.texteChargement}>{t.home.chargement}</p>
      <p style={styles.sousTexte}>{t.home.init}</p>
    </div>
  )
}

function MenuPrincipal({ navigate }) {
  const { t } = useLangue()
  return (
    <div style={styles.page}>
      <div style={styles.menuContainer}>
        <h1 style={styles.titre}>QOMET</h1>
        <p style={styles.sousTitre}>{t.home.menuPrincipal}</p>

        <div style={styles.boutons}>
          <Button icone="📶" label={t.home.jouerReseau}  couleur="#7c3aed" onClick={() => navigate('/reseau')} fullWidth />
          <Button icone="🤖" label={t.home.jouerIA}      couleur="#7c3aed" onClick={() => navigate('/ia')} fullWidth />
          <Button icone="⚙️" label={t.home.parametres}   couleur="#374151" onClick={() => navigate('/parametres')} fullWidth />
          <Button icone="↩"  label={t.home.quitter}      couleur="#dc2626" onClick={closeApp} fullWidth />
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: palette.bg, color: palette.textPrimary,
  },
  menuContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  titre:    { fontSize: '3rem', fontWeight: 'bold', color: palette.violetLight, letterSpacing: '0.2em', marginBottom: '4px' },
  sousTitre:{ fontSize: '0.9rem', color: palette.textSub, marginBottom: '32px', letterSpacing: '0.1em' },
  boutons:  { display: 'flex', flexDirection: 'column', gap: '12px', width: '280px' },
  spinner: {
    width: '40px', height: '40px',
    border: `4px solid ${palette.cardBorder}`,
    borderTop: `4px solid ${palette.violetLight}`,
    borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '24px 0 16px',
  },
  texteChargement: { color: palette.textSub, fontSize: '1rem', marginBottom: '8px' },
  sousTexte:       { color: '#4ade80', fontSize: '0.85rem' },
}
