import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Globe, Monitor } from 'lucide-react'
import BoutonRetour from '../components/layout/BoutonRetour'
import { setEffectsVolume } from '../hooks/useSounds'
import { useLangue } from '../hooks/useLangue'
import { styles, toggleStyle, boutonLangueStyle } from '../styles/pages/Parametres.styles'

const KEYS = {
  volumeEffets: 'qomet_volume',
  port:         'qomet_port',
  pleinEcran:   'qomet_plein_ecran',
}

export default function Parametres() {
  const navigate             = useNavigate()
  const { langue, setLangue, t } = useLangue()
  const p = t.params

  const [volumeEffets, setVolumeEffets] = useState(() => Number(localStorage.getItem(KEYS.volumeEffets) ?? 65))
  const [port,          setPort]          = useState(() => localStorage.getItem(KEYS.port) ?? '7777')
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
    localStorage.setItem(KEYS.port,         port)
    setEffectsVolume(volumeEffets)
    navigate('/')
  }

  return (
    <div style={styles.page}>
      <BoutonRetour onClick={() => navigate('/')} />

      <h1 style={styles.titre}>{p.titre}</h1>
      <p style={styles.sous}>{p.sous}</p>

      <Section icone={<Music size={24} color="#6366f1" />} label={p.audio}>
        <SliderChamp
          label={p.vol_effets}
          valeur={volumeEffets}
          onChange={v => {
            setVolumeEffets(v)
            setEffectsVolume(v)
          }}
        />
      </Section>

      <Section icone={<Globe size={24} color="#6366f1" />} label={p.reseau}>
        <div style={styles.rangee}>
          <span style={styles.champLabel}>{p.port}</span>
          <input
            value={port}
            onChange={e => setPort(e.target.value)}
            style={styles.inputPetit}
          />
        </div>
        <p style={styles.hint}>{p.port_hint}</p>
      </Section>

      <Section icone={<Monitor size={24} color="#6366f1" />} label={p.affichage}>
        <div style={styles.rangee}>
          <div>
            <span style={styles.champLabel}>{p.plein_ecran}</span>
            <p style={styles.hint}>{p.plein_hint}</p>
          </div>
          <Toggle actif={pleinEcran} onChange={handleTogglePleinEcran} />
        </div>

        <div style={{ ...styles.rangee, marginTop: 16 }}>
          <span style={styles.champLabel}>{p.langue}</span>
          <div style={styles.langueOptions}>
            <button style={boutonLangueStyle(langue === 'fr')} onClick={() => setLangue('fr')}>&#127467;&#127479; Français</button>
            <button style={boutonLangueStyle(langue === 'en')} onClick={() => setLangue('en')}>&#127468;&#127463; English</button>
          </div>
        </div>
      </Section>

      <div style={styles.boutons}>
        <button style={styles.btnSave}    onClick={sauvegarder}>{p.sauvegarder}</button>
        <button style={styles.btnAnnuler} onClick={() => navigate('/')}>{p.annuler}</button>
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
