import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Board from '../components/Board'
import PlayerInfo from '../components/PlayerInfo'
import ModalFinPartie from '../components/ModalFinPartie'
import useGameStore from '../store/useGameStore'
import useSocket, { getSocketIA } from '../hooks/useSocket'

const DUREE_MAX_PAUSE = 60 // secondes

export default function Game() {
  const navigate = useNavigate()
  const socket   = useSocket()
  const {
    plateau, joueurs, indexJoueurActif, niveauIA,
    selectionne, coupsValides, peutEjecter, gagnant, codeRoom, maCouleur,
    adversaireEnPause, cellulesGagnantes,
    selectionnerCase, setCoupsValides, setPeutEjecter,
  } = useGameStore()

  const [pauseVisible, setPauseVisible]     = useState(false)
  const [abandonVisible, setAbandonVisible] = useState(false)
  const [startTime]                         = useState(Date.now())
  const [dureePartie, setDureePartie]       = useState('')
  const [tempsJeu, setTempsJeu]             = useState('00:00')
  const [tempsPause, setTempsPause]         = useState(DUREE_MAX_PAUSE)

  const joueurActif = joueurs[indexJoueurActif]
  const modeIA      = joueurs[1]?.nom === 'IA'
  const estTourIA   = modeIA && indexJoueurActif === 1
  const estMonTour  = !codeRoom || joueurActif?.couleur === maCouleur

  // ── Redirection si pas de partie active (refresh page) ──────────────────────
  useEffect(() => {
    const { etatPartie, joueurs } = useGameStore.getState()
    const modeIAActif = joueurs[1]?.nom === 'IA'
    if (etatPartie === 'en_attente' && !modeIAActif) {
      navigate('/')
    }
  }, [])

  // ── Timer de partie ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gagnant || pauseVisible || adversaireEnPause) return
    const interval = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000)
      setTempsJeu(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [gagnant, pauseVisible, adversaireEnPause])

  // ── Durée finale à la fin de partie ─────────────────────────────────────────
  useEffect(() => {
    if (gagnant && !dureePartie) setDureePartie(tempsJeu)
  }, [gagnant])

  // ── Compte à rebours de pause ────────────────────────────────────────────────
  useEffect(() => {
    if (!pauseVisible) { setTempsPause(DUREE_MAX_PAUSE); return }
    const interval = setInterval(() => {
      setTempsPause(t => {
        if (t <= 1) {
          // Temps de pause dépassé → reprendre automatiquement
          setPauseVisible(false)
          if (codeRoom) socket.emit('reprendre')
          return DUREE_MAX_PAUSE
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [pauseVisible])

  // ── Afficher la pause de l'adversaire ────────────────────────────────────────
  useEffect(() => {
    if (adversaireEnPause) setPauseVisible(true)
    else if (!adversaireEnPause && pauseVisible) setPauseVisible(false)
  }, [adversaireEnPause])

  const phase = joueurActif?.en_main > 0 ? 'pose' : 'deplacement'

  // ── Tour de l'IA — délègue entièrement au backend (minimax ou aléatoire) ──────
  useEffect(() => {
    if (!estTourIA || gagnant) return
    const delay = { facile: 600, moyen: 900, difficile: 1300 }[niveauIA] ?? 700
    const sIA   = getSocketIA()
    const timer = setTimeout(() => {
      sIA.emit('coup_ia', { niveau: niveauIA })
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
      setPeutEjecter(false)
      return
    }

    // Sélectionner une pièce pour déplacement
    if (valeur === joueurActif?.couleur) {
      selectionnerCase(r, c)
      setCoupsValides([])
      setPeutEjecter(false)
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
        <span style={{ color: '#475569', fontSize: '0.85rem', fontFamily: 'monospace' }}>⏱ {tempsJeu}</span>
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
          cellulesGagnantes={new Set(cellulesGagnantes.map(([r,c]) => `${r},${c}`))}
        />
        <PlayerInfo joueur={joueurs[1]} estActif={indexJoueurActif === 1} estMoi={joueurs[1].couleur === maCouleur} />
      </div>

      {selectionne && peutEjecter && estMonTour && !estTourIA && (
        <div style={styles.ejecterBandeau}>
          <button style={styles.ejecterBtn} onClick={() => {
            socket.emit('jouer', { type: 'ejecter', row: selectionne[0], col: selectionne[1] })
            selectionnerCase(null, null)
            setCoupsValides([])
            setPeutEjecter(false)
          }}>
            Sortir du plateau (récupérer en main)
          </button>
        </div>
      )}

      <div style={styles.actions}>
        <BoutonAction label="← Retour"     couleur="#374151" onClick={() => { socket.emit('abandonner'); navigate('/') }} />
        {!modeIA && <BoutonAction label="⏸ Pause" couleur="#1e40af" onClick={() => {
          setPauseVisible(true)
          if (codeRoom) socket.emit('pause')
        }} />}
        <BoutonAction label="⚑ Abandonner" couleur="#dc2626" onClick={() => setAbandonVisible(true)} />
      </div>

      {pauseVisible && (
        <Modale>
          <div style={styles.modaleIcone}>II</div>
          <h2 style={styles.modaleTitre}>Pause</h2>
          <p style={styles.modaleSousTexte}>
            {adversaireEnPause
              ? 'Ton adversaire a mis la partie en pause.'
              : 'La partie est en pause.'}
            <br />Temps restant : <strong style={{ color: tempsPause <= 10 ? '#ef4444' : '#a78bfa' }}>{tempsPause}s</strong>
          </p>
          <div style={styles.modaleJoueurs}>
            <JoueurPause nom={joueurs[0].nom} label="Joueur 1" />
            <span style={{ color: '#64748b', fontWeight: 'bold' }}>VS</span>
            <JoueurPause nom={joueurs[1].nom} label="Joueur 2" />
          </div>
          {!adversaireEnPause && (
            <BoutonAction label="▶ Reprendre la partie" couleur="#7c3aed" onClick={() => {
              setPauseVisible(false)
              if (codeRoom) socket.emit('reprendre')
            }} />
          )}
          <BoutonAction label="← Menu principal" couleur="#374151" onClick={() => { socket.emit('abandonner'); navigate('/') }} />
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
  ejecterBandeau: { display: 'flex', justifyContent: 'center', marginTop: -8 },
  ejecterBtn: {
    background: '#7c3aed', color: '#fff', border: 'none',
    borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 600,
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
