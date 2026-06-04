import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Monitor } from 'lucide-react'
import BoutonRetour from '../components/layout/BoutonRetour'
import { setEffectsVolume } from '../hooks/useSounds'
import { useTranslation } from 'react-i18next'
import { styles, toggleStyle, boutonLangueStyle } from '../styles/pages/Parametres.styles'

const KEYS = {
  volumeEffets: 'qomet_volume',
  pleinEcran:   'qomet_plein_ecran',
}

export default function Parametres() {
  const navigate        = useNavigate()
  const { t, i18n }    = useTranslation()
  const langueOriginale = useRef(i18n.language)

  const [volumeEffets, setVolumeEffets] = useState(() => Number(localStorage.getItem(KEYS.volumeEffets) ?? 65))
  const [pleinEcran,    setPleinEcran]    = useState(() => localStorage.getItem(KEYS.pleinEcran) === 'true')

  useEffect(() => {
    if (window.electronAPI?.getFullScreen) {
      window.electronAPI.getFullScreen().then(v => setPleinEcran(v))
    } else {
      setPleinEcran(!!document.fullscreenElement)
    }

    const onFsChange = () => {
      if (!window.electronAPI) setPleinEcran(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  async function handleTogglePleinEcran(val) {
    setPleinEcran(val)
    localStorage.setItem(KEYS.pleinEcran, val)
    if (window.electronAPI?.setFullScreen) {
      window.electronAPI.setFullScreen(val)
    } else if (val) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  function sauvegarder() {
    localStorage.setItem(KEYS.volumeEffets, volumeEffets)
    setEffectsVolume(volumeEffets)
    navigate('/')
  }

  return (
    <div style={styles.page}>
      <BoutonRetour onClick={() => navigate('/')} />

      <h1 style={styles.titre}>{t('params.titre')}</h1>
      <p style={styles.sous}>{t('params.sous')}</p>

      <Section icone={<Music size={24} color="#6366f1" />} label={t('params.audio')}>
        <SliderChamp
          label={t('params.vol_effets')}
          valeur={volumeEffets}
          onChange={v => {
            setVolumeEffets(v)
            setEffectsVolume(v)
          }}
        />
      </Section>

      <Section icone={<Monitor size={24} color="#6366f1" />} label={t('params.affichage')}>
        <div style={styles.rangee}>
          <div>
            <span style={styles.champLabel}>{t('params.plein_ecran')}</span>
            <p style={styles.hint}>{t('params.plein_hint')}</p>
          </div>
          <Toggle actif={pleinEcran} onChange={handleTogglePleinEcran} />
        </div>

        <div style={{ ...styles.rangee, marginTop: 16 }}>
          <span style={styles.champLabel}>{t('params.langue')}</span>
          <div style={styles.langueOptions}>
            <button style={boutonLangueStyle(i18n.language === 'fr')} onClick={() => i18n.changeLanguage('fr')}>&#127467;&#127479; Français</button>
            <button style={boutonLangueStyle(i18n.language === 'en')} onClick={() => i18n.changeLanguage('en')}>&#127468;&#127463; English</button>
          </div>
        </div>
      </Section>

      <div style={styles.boutons}>
        <button style={styles.btnSave}    onClick={sauvegarder}>{t('params.sauvegarder')}</button>
        <button style={styles.btnAnnuler} onClick={() => { i18n.changeLanguage(langueOriginale.current); navigate('/') }}>{t('params.annuler')}</button>
      </div>
    </div>
  )
}

function Section({ icone, label, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitre}>
        <span>{icone}</span>
        <strong style={{ color: '#fff' }}>{label}</strong>
      </div>
      {children}
    </div>
  )
}

function SliderChamp({ label, valeur, onChange }) {
  return (
    <div style={styles.sliderRow}>
      <div style={styles.sliderHeader}>
        <span style={styles.champLabel}>{label}</span>
        <span style={styles.sliderValeur}>{valeur}%</span>
      </div>
      <input type="range" min={0} max={100} value={valeur} onChange={e => onChange(Number(e.target.value))} style={styles.slider} />
    </div>
  )
}

function Toggle({ actif, onChange }) {
  return (
    <div onClick={() => onChange(!actif)} style={toggleStyle(actif)}>
      <div style={styles.toggleBall} />
    </div>
  )
}
