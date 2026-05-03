import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Board from '../components/Board'
import PlayerInfo from '../components/PlayerInfo'
import ModalFinPartie from '../components/ModalFinPartie'
import useGameStore from '../store/useGameStore'
import useSocket, { getSocketIA } from '../hooks/useSocket'
import { estValide, estJouable } from '../utils/boardGeometry'
import { CASES_JOUABLES } from '../data/mockData'

// Simulation approximative pour l'heuristique IA (ignore les effets de poussée)
function simMove(plateau, fr, fc, tr, tc) {
  const sim = plateau.map(r => [...r])
  sim[tr][tc] = sim[fr][fc]
  sim[fr][fc] = null
  return sim
}

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
  const socket   = useSocket()
  const {
    plateau, joueurs, indexJoueurActif, niveauIA,
    selectionne, coupsValides, gagnant, codeRoom, maCouleur,
    selectionnerCase, setCoupsValides, setGagnant,
  } = useGameStore()

  const [pauseVisible, setPauseVisible]     = useState(false)
  const [abandonVisible, setAbandonVisible] = useState(false)
  const [startTime]                 = useState(Date.now())
  const [dureePartie, setDureePartie]       = useState('')

  const joueurActif = joueurs[indexJoueurActif]
  const modeIA      = joueurs[1]?.nom === 'IA'
  const estTourIA   = modeIA && indexJoueurActif === 1
  const estMonTour  = !codeRoom || joueurActif?.couleur === maCouleur

  // Phase dérivée automatiquement : pose tant qu'il reste des étoiles en main
  const phase = joueurActif?.en_main > 0 ? 'pose' : 'deplacement'

  // ── Durée de partie ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gagnant && !dureePartie) {
      const s = Math.floor((Date.now() - startTime) / 1000)
      setDureePartie(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`)
    }
  }, [gagnant])

  // ── Tour de l'IA (via socketIA — le backend applique les mêmes règles) ───────
  useEffect(() => {
    if (!estTourIA || gagnant) return

    const couleurIA  = joueurs[1].couleur
    const couleurHum = joueurs[0].couleur
    const delay      = { facile: 600, moyen: 900, difficile: 1300 }[niveauIA] ?? 700
    const sIA        = getSocketIA()

    const timer = setTimeout(() => {

      if (phase === 'pose' && joueurs[1].en_main > 0) {
        // Phase de pose : choisir une case vide
        const vides = CASES_JOUABLES.filter(([r, c]) => plateau[r][c] === null)
        if (!vides.length) return

        let choix = vides[Math.floor(Math.random() * vides.length)]
        if (niveauIA !== 'facile') {
          let best = -1
          for (const [r, c] of vides) {
            const sim = plateau.map(row => [...row])
            sim[r][c] = couleurIA
            const s = evaluerPlateau(sim, couleurIA)
            if (s > best) { best = s; choix = [r, c] }
          }
        }
        sIA.emit('jouer', { type: 'poser', row: choix[0], col: choix[1] })

      } else if (phase === 'deplacement') {
        // Phase de déplacement : interroger le backend pour chaque pièce IA,
        // collecter tous les coups valides, puis jouer le meilleur.
        const pieces = CASES_JOUABLES.filter(([r, c]) => plateau[r][c] === couleurIA)
        const allMoves = []
        let idx = 0

        function processNext() {
          if (idx >= pieces.length) {
            if (!allMoves.length) return

            let choix = allMoves[Math.floor(Math.random() * allMoves.length)]
            if (niveauIA !== 'facile') {
              let best = -Infinity
              for (const [fr, fc, tr, tc] of allMoves) {
                const sim  = simMove(plateau, fr, fc, tr, tc)
                const s    = evaluerPlateau(sim, couleurIA)
                const sAdv = niveauIA === 'difficile' ? evaluerPlateau(sim, couleurHum) * 0.8 : 0
                if (s - sAdv > best) { best = s - sAdv; choix = [fr, fc, tr, tc] }
              }
            }
            sIA.emit('jouer', { type: 'deplacement', coup: choix })
            return
          }

          const [pr, pc] = pieces[idx++]
          sIA.once('coups_valides', (data) => {
            ;(data.destinations || []).forEach(([tr, tc]) => allMoves.push([pr, pc, tr, tc]))
            processNext()
          })
          sIA.emit('deplacements_valides', { row: pr, col: pc })
        }

        processNext()
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [indexJoueurActif, gagnant, joueurs])

  // ── Interactions humain (tout via socket — backend valide) ────────────────────
  function handleCellClick(r, c) {
    if (estTourIA || gagnant || !estMonTour) return
    const valeur = plateau[r][c]

    // Déplacer vers une case valide sélectionnée
    if (selectionne && coupsValides.some(([vr, vc]) => vr === r && vc === c)) {
      socket.emit('jouer', { type: 'deplacement', coup: [selectionne[0], selectionne[1], r, c] })
      selectionnerCase(null, null)
      setCoupsValides([])
      return
    }

    // Clic sur la pièce déjà sélectionnée → désélectionner
    if (selectionne && selectionne[0] === r && selectionne[1] === c) {
      selectionnerCase(null, null)
      setCoupsValides([])
      return
    }

    // Sélectionner une pièce pour déplacement
    if (valeur === joueurActif?.couleur) {
      selectionnerCase(r, c)
      setCoupsValides([])
      socket.emit('deplacements_valides', { row: r, col: c })
      return
    }

    // Poser une étoile sur case vide (si encore des étoiles en main)
    if (!valeur && joueurActif?.en_main > 0) {
      socket.emit('jouer', { type: 'poser', row: r, col: c })
      return
    }

    selectionnerCase(null, null)
    setCoupsValides([])
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {gagnant && <ModalFinPartie gagnant={gagnant} duree={dureePartie} />}

      <div style={styles.bandeau}>
        <span style={styles.bandeauTexte}>
          {joueurActif?.en_main > 0 ? 'Clique pour poser ou déplacer' : 'Déplace une étoile'}
        </span>
      </div>

      {estTourIA && (
        <p style={styles.iaThink}>
          <span style={styles.iaDot} /> L'IA réfléchit...
        </p>
      )}

      <div style={styles.zoneJeu}>
        <PlayerInfo joueur={joueurs[0]} estActif={indexJoueurActif === 0} estMoi={joueurs[0].couleur === maCouleur} />
        <Board
          plateau={plateau}
          selectionne={selectionne}
          coupsValides={coupsValides}
          onCellClick={handleCellClick}
          phase={phase}
          cellulesGagnantes={new Set()}
        />
        <PlayerInfo joueur={joueurs[1]} estActif={indexJoueurActif === 1} estMoi={joueurs[1].couleur === maCouleur} />
      </div>

      <div style={styles.actions}>
        <BoutonAction label="← Retour"     couleur="#374151" onClick={() => { socket.emit('abandonner'); navigate('/') }} />
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
          <BoutonAction label="← Menu principal"      couleur="#374151" onClick={() => { socket.emit('abandonner'); navigate('/') }} />
        </Modale>
      )}

      {abandonVisible && (
        <Modale>
          <div style={{ fontSize: '2rem' }}>⚠</div>
          <h2 style={styles.modaleTitre}>Abandonner la partie ?</h2>
          <p style={styles.modaleSousTexte}>Es-tu sûr de vouloir quitter ?<br />Cette action sera comptée comme une <strong>défaite</strong>.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <BoutonAction label="Annuler"    couleur="#374151" onClick={() => setAbandonVisible(false)} />
            <BoutonAction label="Abandonner" couleur="#dc2626" onClick={() => {
              socket.emit('abandonner')
              navigate('/')
            }} />
          </div>
        </Modale>
      )}

    </div>
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
