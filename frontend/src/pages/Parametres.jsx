import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Globe, Monitor } from 'lucide-react'
import BoutonRetour from '../components/BoutonRetour'
import { setEffectsVolume } from '../hooks/useSounds'
import { useLangue } from '../hooks/useLangue'

export default function Parametres() {
  const navigate = useNavigate()
  const { langue, setLangue, t } = useLangue()
  const p = t.params

  const [volumeMusique, setVolumeMusique] = useState(70)
  const [volumeEffets,  setVolumeEffets]  = useState(80)
  const [pleinEcran,    setPleinEcran]    = useState(false)

  function sauvegarder() {
    navigate('/')
  }

  return (
    <div style={styles.page}>
      <BoutonRetour onClick={() => navigate('/')} />

      <h1 style={styles.titre}>{p.titre}</h1>
      <p style={styles.sous}>{p.sous}</p>

      {/* ── Audio ── */}
      <Section icone={<Music size={24} color="#6366f1" />} label={p.audio}>
        <SliderChamp label={p.vol_musique} valeur={volumeMusique} onChange={setVolumeMusique}/>
        <SliderChamp label={p.vol_effets}  valeur={volumeEffets}  onChange={v => { setVolumeEffets(v); setEffectsVolume(v) }}/>
      </Section>

      {/* ── Réseau ── */}
      <Section icone={<Globe size={24} color="#6366f1" />} label={p.reseau}>
        <div style={styles.rangee}>
          <span style={styles.champLabel}>{p.port}</span>
          <input defaultValue="5173" style={styles.inputPetit} />
        </div>
        <p style={styles.hint}>{p.port_hint}</p>
      </Section>

      {/* ── Affichage ── */}
      <Section icone={<Monitor size={24} color="#6366f1" />} label={p.affichage}>
        <div style={styles.rangee}>
          <div>
            <span style={styles.champLabel}>{p.plein_ecran}</span>
            <p style={styles.hint}>{p.plein_hint}</p>
          </div>
          <Toggle actif={pleinEcran} onChange={setPleinEcran} />
        </div>

        <div style={{ ...styles.rangee, marginTop: 16 }}>
          <span style={styles.champLabel}>{p.langue}</span>
          <div style={styles.langueOptions}>
            <BoutonLangue label="🇫🇷 Français" actif={langue === 'fr'} onClick={() => setLangue('fr')} />
            <BoutonLangue label="🇬🇧 English"  actif={langue === 'en'} onClick={() => setLangue('en')} />
          </div>
        </div>
      </Section>

      {/* ── Boutons ── */}
      <div style={styles.boutons}>
        <button style={styles.btnSave}    onClick={sauvegarder}>{p.sauvegarder}</button>
        <button style={styles.btnAnnuler} onClick={() => navigate('/')}>{p.annuler}</button>
      </div>
    </div>
  )
}

function BoutonLangue({ label, actif, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: actif ? '#6366f1' : '#1e293b',
      color: actif ? '#fff' : '#94a3b8',
      border: `1.5px solid ${actif ? '#6366f1' : '#334155'}`,
      borderRadius: 8, padding: '7px 16px',
      fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
    }}>
      {label}
    </button>
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
    <div style={{ marginBottom: 16 }}>
      <div style={styles.rangee}>
        <span style={styles.champLabel}>{label}</span>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{valeur}%</span>
      </div>
      <input type="range" min={0} max={100} value={valeur} onChange={e => onChange(Number(e.target.value))} style={styles.slider}/>
    </div>
  )
}

function Toggle({ actif, onChange }) {
  return (
    <div onClick={() => onChange(!actif)} style={{
      ...styles.toggle,
      background: actif ? '#6366f1' : '#334155',
      justifyContent: actif ? 'flex-end' : 'flex-start',
    }}>
      <div style={styles.toggleBall}/>
    </div>
  )
}

const styles = {
  page:         { minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#fff', position: 'relative' },
  titre:        { fontSize: 32, fontWeight: 700, marginBottom: 4 },
  sous:         { color: '#94a3b8', marginBottom: 32 },
  section:      { background: '#1e293b', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 560, marginBottom: 16 },
  sectionTitre: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 16, fontWeight: 600 },
  rangee:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  champLabel:   { color: '#cbd5e1', fontSize: 14 },
  hint:         { color: '#475569', fontSize: 12, margin: '4px 0 0' },
  inputPetit:   { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', color: '#fff', width: 80, fontSize: 13 },
  slider:       { width: '100%', marginTop: 8, accentColor: '#6366f1' },
  langueOptions:{ display: 'flex', gap: 8 },
  toggle:       { width: 44, height: 24, borderRadius: 999, display: 'flex', alignItems: 'center', padding: '0 3px', cursor: 'pointer', transition: 'background .2s' },
  toggleBall:   { width: 18, height: 18, borderRadius: '50%', background: '#fff' },
  boutons:      { display: 'flex', gap: 12, width: '100%', maxWidth: 560, marginTop: 8 },
  btnSave:      { flex: 1, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  btnAnnuler:   { background: '#334155', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
}
