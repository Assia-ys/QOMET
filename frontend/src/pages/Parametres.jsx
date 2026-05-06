import PagePlaceholder from '../components/PagePlaceholder'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Globe, Monitor } from 'lucide-react'
import BoutonRetour from '../components/BoutonRetour'
import { setEffectsVolume } from '../hooks/useSounds'

export default function Parametres() {
  const navigate = useNavigate()

  const [volumeMusique, setVolumeMusique] = useState(70)
  const [volumeEffets,  setVolumeEffets]  = useState(80)
  const [pleinEcran,    setPleinEcran]    = useState(false)
  const [langue,        setLangue]        = useState('Français')

  function sauvegarder() {
    // Tu pourras brancher ça sur un vrai système de config plus tard
    alert('Paramètres sauvegardés !')
  }

  return (
    <div style={styles.page}>
      <BoutonRetour onClick={() => navigate('/')} />

      <h1 style={styles.titre}>Paramètres</h1>
      <p style={styles.sous}>Configurez votre expérience de jeu</p>

      {/* ── Audio ── */}
      <Section icone={<Music size={24} color="#6366f1" />} label="Audio">
        <SliderChamp label="Volume de la musique" valeur={volumeMusique} onChange={setVolumeMusique}/>
        <SliderChamp label="Volume des effets sonores" valeur={volumeEffets} onChange={v => { setVolumeEffets(v); setEffectsVolume(v) }}/>
      </Section>

      {/* ── Réseau ── */}
      <Section icone={<Globe size={24} color="#6366f1" />} label="Réseau">
        <div style={styles.rangee}>
          <span style={styles.champLabel}>Port du serveur</span>
          <input defaultValue="5173" style={styles.inputPetit} />
        </div>
        <p style={styles.hint}>Adresse locale pour la connexion réseau locale</p>
      </Section>

      {/* ── Affichage ── */}
      <Section icone={<Monitor size={24} color="#6366f1" />} label="Affichage">
        <div style={styles.rangee}>
          <div>
            <span style={styles.champLabel}>Mode plein écran</span>
            <p style={styles.hint}>Affiche le jeu en plein écran</p>
          </div>
          <Toggle actif={pleinEcran} onChange={setPleinEcran} />
        </div>

        <div style={{ ...styles.rangee, marginTop: 16 }}>
          <span style={styles.champLabel}>Langue</span>
          <select value={langue} onChange={e => setLangue(e.target.value)} style={styles.select}>
            <option>Français</option>
            <option>English</option>
            <option>Español</option>
          </select>
        </div>
      </Section>

      {/* ── Boutons ── */}
      <div style={styles.boutons}>
        <button style={styles.btnSave} onClick={sauvegarder}>Sauvegarder les paramètres</button>
        <button style={styles.btnAnnuler} onClick={() => navigate('/')}>
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Sous-composants ───────────────────────────────────────────────────

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
    <div
      onClick={() => onChange(!actif)}
      style={{...styles.toggle, background: actif ? '#6366f1' : '#334155', justifyContent: actif ? 'flex-end' : 'flex-start',}}>
      <div style={styles.toggleBall}/>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────

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
  select:       { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, cursor: 'pointer' },
  toggle:       { width: 44, height: 24, borderRadius: 999, display: 'flex', alignItems: 'center', padding: '0 3px', cursor: 'pointer', transition: 'background .2s, justify-content .2s' },
  toggleBall:   { width: 18, height: 18, borderRadius: '50%', background: '#fff' },
  boutons:      { display: 'flex', gap: 12, width: '100%', maxWidth: 560, marginTop: 8 },
  btnSave:      { flex: 1, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  btnAnnuler:   { background: '#334155', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
}