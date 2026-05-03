import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Board from '../components/Board'
import PlayerInfo from '../components/PlayerInfo'
import ModalFinPartie from '../components/ModalFinPartie'
import useGameStore from '../store/useGameStore'
import { getCasesAccessibles, appliquerMouvement, detecterCarreGagnant } from '../utils/rulesClient'
import { estValide, estJouable } from '../utils/boardGeometry'
import { CASES_JOUABLES } from '../data/mockData'

// Heuristique : compte les carrés partiels sans pièces adverses
function evaluerPlateau(plateau, couleur) {
  let score = 0
  for (let i = 0; i < CASES_JOUABLES.length; i++) {
    for (let j = i + 1; j < CASES_JOUABLES.length; j++) {
      const [r1, c1] = CASES_JOUABLES[i]
      const [r2, c2] = CASES_JOUABLES[j]
      const dr = r2 - r1, dc = c2 - c1
      const r3 = r1 + dc, c3 = c1 - dr
      const r4 = r2 + dc, c4 = c2 - dr
      if (!estValide(r3, c3) || !estJouable(r3, c3)) continue
      if (!estValide(r4, c4) || !estJouable(r4, c4)) continue
      const cells = [[r1,c1],[r2,c2],[r3,c3],[r4,c4]]
      const friendly = cells.filter(([r,c]) => plateau[r][c] === couleur).length
      const enemy    = cells.filter(([r,c]) => plateau[r][c] !== null && plateau[r][c] !== couleur).length
      if (enemy === 0 && friendly > 0) score += friendly * friendly
    }
  }
  return score
}

export default function Game() {
  const navigate = useNavigate()
  const {
    plateau, joueurs, indexJoueurActif, niveauIA,
    selectionne, coupsValides, gagnant,
    selectionnerCase, setCoupsValides, setPlateau, changerTour,
    poserEtoile, recupererEtoile, setGagnant,
  } = useGameStore()

  const [phase, setPhase]                         = useState('pose')
  const [pauseVisible, setPauseVisible]           = useState(false)
  const [abandonVisible, setAbandonVisible]       = useState(false)
  const [cellulesGagnantes, setCellulesGagnantes] = useState(new Set())
  const [startTime]                               = useState(Date.now())
  const [dureePartie, setDureePartie]             = useState('')

  const joueurActif = joueurs[indexJoueurActif]
  const modeIA    = joueurs[1]?.nom === 'IA'
  const estTourIA = modeIA && indexJoueurActif === 1

  // ── Détection victoire ────────────────────────────────────────────────────────
  useEffect(() => {
    if (gagnant) return
    const resultat = detecterCarreGagnant(plateau)
    if (!resultat) return
    const vainqueur = joueurs.find(j => j.couleur === resultat.couleur)
    setCellulesGagnantes(new Set(resultat.cellules.map(([r,c]) => `${r},${c}`)))
    const s = Math.floor((Date.now() - startTime) / 1000)
    setDureePartie(`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`)
    setGagnant(vainqueur)
  }, [plateau])

  // ── Auto-switch pose → déplacement ───────────────────────────────────────────
  useEffect(() => {
    if (phase === 'pose' && joueurs[0].en_main === 0 && joueurs[1].en_main === 0) {
      setPhase('deplacement')
    }
  }, [joueurs])

  // ── Tour de l'IA ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!estTourIA || gagnant) return

    const couleurIA  = joueurs[1].couleur
    const couleurHum = joueurs[0].couleur
    const delay = { facile: 600, moyen: 900, difficile: 1300 }[niveauIA] ?? 700

    const timer = setTimeout(() => {

      if (phase === 'pose' && joueurs[1].en_main > 0) {
        const vides = CASES_JOUABLES.filter(([r,c]) => plateau[r][c] === null)
        if (!vides.length) return

        let choix = vides[Math.floor(Math.random() * vides.length)]
        if (niveauIA !== 'facile') {
          let best = -1
          for (const [r,c] of vides) {
            const sim = plateau.map(row => [...row])
            sim[r][c] = couleurIA
            const s = evaluerPlateau(sim, couleurIA)
            if (s > best) { best = s; choix = [r,c] }
          }
        }
        const nouveau = plateau.map(row => [...row])
        nouveau[choix[0]][choix[1]] = couleurIA
        setPlateau(nouveau)
        poserEtoile(1)
        changerTour()

      } else if (phase === 'deplacement') {
        const moves = []
        for (const [r,c] of CASES_JOUABLES) {
          if (plateau[r][c] !== couleurIA) continue
          for (const dest of getCasesAccessibles(plateau, r, c))
            moves.push({ from: [r,c], to: dest })
        }
        if (!moves.length) { changerTour(); return }

        let choix = moves[Math.floor(Math.random() * moves.length)]
        if (niveauIA !== 'facile') {
          let best = -Infinity
          for (const m of moves) {
            const { nouveauPlateau } = appliquerMouvement(plateau, m.from[0], m.from[1], m.to[0], m.to[1])
            const s    = evaluerPlateau(nouveauPlateau, couleurIA)
            const sAdv = niveauIA === 'difficile' ? evaluerPlateau(nouveauPlateau, couleurHum) : 0
            const total = s - sAdv * 0.8
            if (total > best) { best = total; choix = m }
          }
        }
        const { nouveauPlateau, etoileEjectee } = appliquerMouvement(
          plateau, choix.from[0], choix.from[1], choix.to[0], choix.to[1]
        )
        setPlateau(nouveauPlateau)
        if (etoileEjectee) recupererEtoile(etoileEjectee)
        selectionnerCase(null, null)
        setCoupsValides([])
        changerTour()
      }

    }, delay)

    return () => clearTimeout(timer)
  }, [indexJoueurActif, phase, gagnant])

  // ── Interactions humain ───────────────────────────────────────────────────────
  function handleCellClick(r, c) {
    if (estTourIA || gagnant) return
    const valeur = plateau[r][c]

    if (selectionne && coupsValides.some(([vr,vc]) => vr === r && vc === c)) {
      const { nouveauPlateau, etoileEjectee } = appliquerMouvement(
        plateau, selectionne[0], selectionne[1], r, c
      )
      setPlateau(nouveauPlateau)
      if (etoileEjectee) recupererEtoile(etoileEjectee)
      selectionnerCase(null, null)
      setCoupsValides([])
      changerTour()
      return
    }

    if (valeur === joueurActif.couleur && phase === 'deplacement') {
      selectionnerCase(r, c)
      setCoupsValides(getCasesAccessibles(plateau, r, c))
      return
    }

    if (phase === 'pose' && !valeur && joueurActif.en_main > 0) {
      const nouveau = plateau.map(row => [...row])
      nouveau[r][c] = joueurActif.couleur
      setPlateau(nouveau)
      poserEtoile(indexJoueurActif)
      changerTour()
      return
    }

    selectionnerCase(null, null)
    setCoupsValides([])
  }

  function changerPhase(p) {
    setPhase(p)
    selectionnerCase(null, null)
    setCoupsValides([])
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {gagnant && <ModalFinPartie gagnant={gagnant} duree={dureePartie} />}

      <div style={styles.bandeau}>
        <span style={styles.bandeauTexte}>
          {phase === 'pose' ? '⭐ Phase de pose' : '↔ Phase de déplacement'}
        </span>
        {!modeIA && (
          <div style={styles.switchPhase}>
            <BoutonPhase label="Poser"    actif={phase === 'pose'}        onClick={() => changerPhase('pose')} />
            <BoutonPhase label="Déplacer" actif={phase === 'deplacement'} onClick={() => changerPhase('deplacement')} />
          </div>
        )}
      </div>

      {estTourIA && (
        <p style={styles.iaThink}>
          <span style={styles.iaDot} /> L'IA réfléchit...
        </p>
      )}

      <div style={styles.zoneJeu}>
        <PlayerInfo joueur={joueurs[0]} estActif={indexJoueurActif === 0} />
        <Board
          plateau={plateau}
          selectionne={selectionne}
          coupsValides={coupsValides}
          onCellClick={handleCellClick}
          phase={phase}
          cellulesGagnantes={cellulesGagnantes}
        />
        <PlayerInfo joueur={joueurs[1]} estActif={indexJoueurActif === 1} />
      </div>

      <div style={styles.actions}>
        <BoutonAction label="← Retour"     couleur="#374151" onClick={() => navigate('/')} />
        {!modeIA && <BoutonAction label="⏸ Pause" couleur="#1e40af" onClick={() => setPauseVisible(true)} />}
        <BoutonAction label="⚑ Abandonner" couleur="#dc2626" onClick={() => setAbandonVisible(true)} />
      </div>

      {pauseVisible && (
        <Modale>
          <div style={styles.modaleIcone}>II</div>
          <h2 style={styles.modaleTitre}>Pause</h2>
          <p style={styles.modaleSousTexte}>La partie est en pause.<br />Reprends quand tu es prêt !</p>
          <div style={styles.modaleJoueurs}>
            <JoueurPause nom={joueurs[0].nom} label="Ton tour" />
            <span style={{ color: '#64748b', fontWeight: 'bold' }}>VS</span>
            <JoueurPause nom={joueurs[1].nom} label="En attente" />
          </div>
          <BoutonAction label="▶ Reprendre la partie" couleur="#7c3aed" onClick={() => setPauseVisible(false)} />
          <BoutonAction label="← Menu principal"      couleur="#374151" onClick={() => navigate('/')} />
        </Modale>
      )}

      {abandonVisible && (
        <Modale>
          <div style={{ fontSize: '2rem' }}>⚠</div>
          <h2 style={styles.modaleTitre}>Abandonner la partie ?</h2>
          <p style={styles.modaleSousTexte}>Es-tu sûr de vouloir quitter ?<br />Cette action sera comptée comme une <strong>défaite</strong>.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <BoutonAction label="Annuler"    couleur="#374151" onClick={() => setAbandonVisible(false)} />
            <BoutonAction label="Abandonner" couleur="#dc2626" onClick={() => navigate('/')} />
          </div>
        </Modale>
      )}

    </div>
  )
}

function BoutonPhase({ label, actif, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 16px', borderRadius: 20, border: 'none',
      backgroundColor: actif ? '#7c3aed' : '#1e293b',
      color: actif ? '#fff' : '#64748b',
      fontWeight: actif ? '600' : '400',
      fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

function BoutonAction({ label, couleur, onClick }) {
  const [survol, setSurvol] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{
        padding: '10px 22px', borderRadius: 8, border: 'none',
        backgroundColor: survol ? couleur : couleur + 'cc',
        color: '#fff', fontWeight: '600', fontSize: '0.9rem',
        cursor: 'pointer', transition: 'all 0.15s',
        transform: survol ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {label}
    </button>
  )
}

function Modale({ children }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modale}>{children}</div>
    </div>
  )
}

function JoueurPause({ nom, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#f1f5f9', fontWeight: 'bold' }}>{nom}</div>
      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{label}</div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', backgroundColor: '#0f172a',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 20, padding: 20,
  },
  bandeau:      { display: 'flex', alignItems: 'center', gap: 16 },
  bandeauTexte: { color: '#94a3b8', fontSize: '0.9rem' },
  switchPhase: {
    display: 'flex', gap: 4, backgroundColor: '#0f172a',
    padding: 4, borderRadius: 24, border: '1px solid #1e293b',
  },
  iaThink: {
    color: '#a78bfa', fontSize: '0.85rem', margin: '-8px 0 0',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  iaDot: {
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', background: '#a78bfa',
    animation: 'pulse 1s ease-in-out infinite',
  },
  zoneJeu:  { display: 'flex', alignItems: 'center', gap: 24 },
  actions:  { display: 'flex', gap: 12, marginTop: 8 },
  overlay:  {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modale: {
    backgroundColor: '#1e293b', border: '1px solid #334155',
    borderRadius: 16, padding: 36,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16, minWidth: 320, boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  modaleIcone:     { fontSize: '2rem', color: '#a78bfa', fontWeight: 'bold' },
  modaleTitre:     { color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 'bold' },
  modaleSousTexte: { color: '#94a3b8', textAlign: 'center', lineHeight: 1.6, fontSize: '0.9rem' },
  modaleJoueurs: {
    display: 'flex', alignItems: 'center', gap: 24,
    padding: '12px 24px', backgroundColor: '#0f172a',
    borderRadius: 12, width: '100%', justifyContent: 'center',
  },
}
