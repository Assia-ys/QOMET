import PagePlaceholder from '../components/PagePlaceholder'
import useGameStore from '../store/useGameStore'
import ModalFinPartie from '../components/ModalFinPartie' 
import { useEffect, useRef, useState } from 'react'

export default function Game() {
  const { etatPartie, gagnant, setGagnant } = useGameStore()
  const audioRef = useRef(null)

  // ─── CHRONOMÈTRE ────────────────────────────────────────────────────────
  const [tempsEcoule, setTempsEcoule] = useState(0)

  useEffect(() => {
    let interval
    // Le chrono tourne tant que la partie n'est pas terminée
    if (etatPartie !== 'terminee') {
      interval = setInterval(() => {
        setTempsEcoule((t) => t + 1)
      }, 1000)
    }
    // Nettoyage de l'intervalle si le composant est détruit ou la partie terminée
    return () => clearInterval(interval)
  }, [etatPartie])

  // Transforme les secondes (ex: 65) en format texte (ex: "1:05")
  const formaterTemps = (secondes) => {
    const m = Math.floor(secondes / 60)
    const s = secondes % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  // ────────────────────────────────────────────────────────────────────────

  // Se lance une seule fois au chargement de la page Game
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3 // Règle le volume à 30% pour ne pas exploser les oreilles
      
      // .catch() évite une erreur rouge si le navigateur bloque l'autoplay (sécurité standard)
      audioRef.current.play().catch(err => console.log("Lecture automatique bloquée :", err))
    }
  }, [])

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0f172a' }}>

      {/* Lecteur audio invisible, tourne en boucle */}
      <audio ref={audioRef} src="/music.mp3" loop />

      {/* Affichage du chrono en haut à droite */}
      <div style={{ position: 'absolute', top: 24, right: 32, color: '#fff', fontSize: 24, fontWeight: 700, background: '#1e293b', padding: '8px 16px', borderRadius: 12 }}>
        ⏱ {formaterTemps(tempsEcoule)}
      </div>

      {/* Plateau à implémenter plus tard */}
      <p style={{ color: '#fff', padding: 40 }}>Plateau de jeu (à venir)</p>

      {/* Bouton temporaire pour tester la modale */}
      <button onClick={() => setGagnant({ nom: 'Alice' })}
        style={{ margin: 40, padding: 12, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        Simuler victoire (test)
      </button>

      {etatPartie === 'terminee' && (
        <ModalFinPartie gagnant={gagnant} duree={formaterTemps(tempsEcoule)} />
      )}

    </div>
  )
}