import PagePlaceholder from '../components/PagePlaceholder'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/useGameStore'
import { Sparkles, Zap, Flame } from 'lucide-react'

const NIVEAUX = [
  {
    id: 'facile',
    label: 'Facile',
    badge: 'Accessible à tous',
    description: 'Parfait pour débuter et apprendre les mécaniques du jeu',
    icon: <Sparkles size={32} />,
    couleur: 'green',
  },
  {
    id: 'moyen',
    label: 'Moyen',
    badge: 'Challenge modéré',
    description: 'Un challenge équilibré pour les joueurs expérimentés',
    icon: <Zap size={32} />,
    couleur: 'orange',
  },
  {
    id: 'difficile',
    label: 'Difficile',
    badge: 'Expert seulement',
    description: "Une IA impitoyable qui ne vous fera aucun cadeau",
    icon: <Flame size={32} />,
    couleur: 'red',
  },
]

export default function IA() {
  return <PagePlaceholder nom="Intelligence Artificielle" route="/ia" />
  const navigate = useNavigate()
  const { reinitialiser, setConfigIA } = useGameStore()

  const [niveauChoisi, setNiveauChoisi] = useState('facile')
  const [prenom, setPrenom]             = useState('')
  
  function commencer() {
    if (!prenom.trim()) return   // bloque si prénom vide
    reinitialiser()
    setConfigIA(niveauChoisi, prenom.trim())
    navigate('/jeu')
  }

  return (
    <div style={styles.page}>
      <button onClick={() => navigate('/')} style={styles.retour}>← Retour</button>
      <h1 style={styles.titre}>Niveau de difficulté</h1>
      <p style={styles.sous}>Choisissez le niveau de l'intelligence artificielle</p>

      {/* Cartes */}
      <div style={styles.grille}>
        {NIVEAUX.map((n) => (
          <CarteNiveau key={n.id} niveau={n} selectionne={niveauChoisi === n.id} onClick={() => setNiveauChoisi(n.id)}/>
        ))}
      </div>

      {/* Prénom */}
      <div style={styles.champ}>
        <label style={styles.label}>Ton prénom</label>
        <input style={styles.input} placeholder="Ex: Alice" value={prenom} onChange={(e) => setPrenom(e.target.value)}/>
      </div>

      {/* Bouton */}
      <button
        style={{ ...styles.bouton, opacity: prenom.trim() ? 1 : 0.5, cursor: prenom.trim() ? 'pointer' : 'not-allowed',}}
        onClick={() => navigate('/jeu')}
        onClick={commencer}
        disabled={!prenom.trim()}
      >
        Commencer la partie contre IA
      </button>
    </div>
  )
}

// ── Sous-composant carte ──────────────────────────────────────────────
function CarteNiveau({ niveau, selectionne, onClick }) {
  const bordure = {
    green:  '#22c55e',
    orange: '#f97316',
    red:    '#ef4444',
  }[niveau.couleur]

  return (
    <div onClick={onClick} style={{ ...styles.carte, border: `2px solid ${selectionne ? bordure : '#334155'}`, position: 'relative', cursor: 'pointer',}}>
      {/* Coche verte si sélectionné */}
      {selectionne && (
        <span style={{ ...styles.coche, background: bordure }}>✓</span>
      )}

      <div style={{ marginBottom: 8, display: 'flex', color: bordure }}>{niveau.icon}</div>
      <strong style={{ color: '#fff', fontSize: 18 }}>{niveau.label}</strong>

      <span style={{ ...styles.badge, background: bordure + '33', color: bordure }}>
        {niveau.badge}
      </span>

      <p style={styles.desc}>{niveau.description}</p>
    </div>
  )
}

// ── Styles inline (tu pourras migrer en CSS/Tailwind après) ───────────
const styles = {
  page:    { position: 'relative', minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: '#fff' },
  titre:   { fontSize: 36, fontWeight: 700, marginBottom: 4 },
  sous:    { color: '#94a3b8', marginBottom: 40 },
  grille:  { display: 'flex', gap: 24, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' },
  carte:   { background: '#1e293b', borderRadius: 16, padding: '2rem', width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', transition: 'border .2s' },
  coche:   { position: 'absolute', top: -12, right: -12, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 },
  badge:   { borderRadius: 999, padding: '2px 12px', fontSize: 12, fontWeight: 600 },
  desc:    { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  champ:   { display: 'flex', flexDirection: 'column', gap: 6, width: 400, marginBottom: 16 },
  label:   { color: '#94a3b8', fontSize: 14 },
  input:   { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 15, outline: 'none' },
  bouton:  { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 16, fontWeight: 600, width: 400 },
  retour: { position: 'absolute', top: 24, left: 24, background: 'transparent', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px', color: '#94a3b8', fontSize: 14, cursor: 'pointer' },

}
