import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { closeApp } from '../config/config'
import Button from '../components/ui/Button'
import { styles } from '../styles/pages/Home.styles'

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
  const { t } = useTranslation()
  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>QOMET</h1>
      <div style={styles.spinner} />
      <p style={styles.texteChargement}>{t('home.chargement')}</p>
      <p style={styles.sousTexte}>{t('home.init')}</p>
    </div>
  )
}

function MenuPrincipal({ navigate }) {
  const { t } = useTranslation()
  return (
    <div style={styles.page}>
      <div style={styles.menuContainer}>
        <h1 style={styles.titre}>QOMET</h1>
        <p style={styles.sousTitre}>{t('home.menuPrincipal')}</p>
        <div style={styles.boutons}>
          <Button icone="📶" label={t('home.jouerReseau')}  couleur="#7c3aed" onClick={() => navigate('/reseau')}     fullWidth />
          <Button icone="🤖" label={t('home.jouerIA')}      couleur="#7c3aed" onClick={() => navigate('/ia')}         fullWidth />
          <Button icone="⚙️" label={t('home.parametres')}   couleur="#374151" onClick={() => navigate('/parametres')} fullWidth />
          <Button icone="↩"  label={t('home.quitter')}      couleur="#dc2626" onClick={closeApp}                     fullWidth />
        </div>
      </div>
    </div>
  )
}
