import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Board from '../components/Board'
import PlayerInfo from '../components/PlayerInfo'
import ModalFinPartie from '../components/ModalFinPartie'
import useGameStore from '../store/useGameStore'
import useSocket, { getSocketIA } from '../hooks/useSocket'
import BoutonRetour from '../components/BoutonRetour'
import BoutonMenu from '../components/BoutonMenu'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { playWin, playLose } from '../hooks/useSounds'
import { useLangue } from '../hooks/useLangue'
import { palette } from '../styles/palette'

const DUREE_MAX_PAUSE = 60 // secondes

export default function Game() {
  const navigate = useNavigate()
  const socket   = useSocket()
  const { t }    = useLangue()
  const g        = t.game
  const {
    plateau, joueurs, indexJoueurActif, niveauIA,
    selectionne, coupsValides, peutEjecter, gagnant, codeRoom, maCouleur,
    adversaireEnPause, cellulesGagnantes, prenomJoueur,
    selectionnerCase, setCoupsValides, setPeutEjecter,
  } = useGameStore()

  const [pauseVisible, setPauseVisible]     = useState(false)
  const [abandonVisible, setAbandonVisible] = useState(false)
  const [startTime]                         = useState(Date.now())
  const [dureePartie, setDureePartie]       = useState('')
  const [tempsJeu, setTempsJeu]             = useState('00:00')
  const [tempsPause, setTempsPause]         = useState(DUREE_MAX_PAUSE)

  const joueurActif = joueurs[indexJoueurActif]
  const modeIA      = joueurs.some(j => j?.nom === 'IA')
  const estTourIA   = modeIA && joueurActif?.nom === 'IA'
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

  // ── Durée finale + son victoire/défaite ─────────────────────────────────────
  useEffect(() => {
    if (!gagnant) return
    if (!dureePartie) setDureePartie(tempsJeu)
    const aGagne = !!gagnant.forfait || gagnant.nom === prenomJoueur
    const t = setTimeout(() => aGagne ? playWin() : playLose(), 250)
    return () => clearTimeout(t)
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

      <BoutonRetour onClick={() => { socket.emit('abandonner'); navigate(modeIA ? '/ia' : '/reseau') }} />

      <div style={styles.bandeau}>
        <span style={styles.bandeauTexte}>
          {joueurActif?.en_main > 0 ? g.poser_ou_deplacer : g.deplacer}
        </span>
        <span style={{ color: '#475569', fontSize: '0.85rem', fontFamily: 'monospace' }}>⏱ {tempsJeu}</span>
      </div>

      {estTourIA && (
        <p style={styles.iaThink}>
          <span style={styles.iaDot} /> {g.ia_reflechit}
        </p>
      )}

      <div style={styles.zoneJeu}>
        <PlayerInfo joueur={joueurs[0]} estActif={indexJoueurActif === 0} estMoi={joueurs[0].couleur === maCouleur} niveauIA={joueurs[0]?.nom === 'IA' ? niveauIA : undefined} />
        <Board
          plateau={plateau}
          selectionne={selectionne}
          coupsValides={coupsValides}
          onCellClick={handleCellClick}
          phase={phase}
          cellulesGagnantes={new Set(cellulesGagnantes.map(([r,c]) => `${r},${c}`))}
        />
        <PlayerInfo joueur={joueurs[1]} estActif={indexJoueurActif === 1} estMoi={joueurs[1].couleur === maCouleur} niveauIA={joueurs[1]?.nom === 'IA' ? niveauIA : undefined} />
      </div>

      {selectionne && peutEjecter && estMonTour && !estTourIA && (
        <div style={styles.ejecterBandeau}>
          <button style={styles.ejecterBtn} onClick={() => {
            socket.emit('jouer', { type: 'ejecter', row: selectionne[0], col: selectionne[1] })
            selectionnerCase(null, null)
            setCoupsValides([])
            setPeutEjecter(false)
          }}>
            {g.sortir_plateau}
          </button>
        </div>
      )}

      <div style={styles.actions}>
        <BoutonMenu onClick={() => { socket.emit('abandonner'); navigate('/') }} label="Menu" />
        {!modeIA && <Button label={g.pause}      couleur="#1e40af" onClick={() => {
          setPauseVisible(true)
          if (codeRoom) socket.emit('pause')
        }} />}
        <Button label={g.abandonner} couleur="#dc2626" onClick={() => setAbandonVisible(true)} />
      </div>

      {pauseVisible && (
        <Modal>
          <div style={styles.modaleIcone}>II</div>
          <h2 style={styles.modaleTitre}>{g.pause_titre}</h2>
          <p style={styles.modaleSousTexte}>
            {adversaireEnPause ? g.pause_msg_adverse : g.pause_attente}
            <br />{g.pause_reprise_auto} : <strong style={{ color: tempsPause <= 10 ? '#ef4444' : '#a78bfa' }}>{tempsPause}s</strong>
          </p>
          <div style={styles.modaleJoueurs}>
            <JoueurPause nom={joueurs[0].nom} label="Joueur 1" />
            <span style={{ color: '#64748b', fontWeight: 'bold' }}>VS</span>
            <JoueurPause nom={joueurs[1].nom} label="Joueur 2" />
          </div>
          {!adversaireEnPause && (
            <Button label={g.reprendre} couleur="#7c3aed" onClick={() => {
              setPauseVisible(false)
              if (codeRoom) socket.emit('reprendre')
            }} />
          )}
          <BoutonMenu onClick={() => { socket.emit('abandonner'); navigate('/') }} />
        </Modal>
      )}

      {abandonVisible && (
        <Modal>
          <div style={{ fontSize: '2rem' }}>⚠</div>
          <h2 style={styles.modaleTitre}>{g.abandon_titre}</h2>
          <p style={styles.modaleSousTexte}>{g.abandon_msg.split('\n')[0]}<br />{g.abandon_msg.split('\n')[1]}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button label={g.annuler}    couleur="#374151" onClick={() => setAbandonVisible(false)} />
            <Button label={g.abandonner} couleur="#dc2626" onClick={() => {
              socket.emit('abandonner')
              navigate('/')
            }} />
          </div>
        </Modal>
      )}

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
    minHeight: '100vh', backgroundColor: palette.bg,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 20, padding: 20, position: 'relative',
  },
  bandeau:      { display: 'flex', alignItems: 'center', gap: 16 },
  bandeauTexte: { color: palette.textSub, fontSize: '0.9rem' },
  ejecterBandeau: { display: 'flex', justifyContent: 'center', marginTop: -8 },
  ejecterBtn: {
    background: palette.violet, color: '#fff', border: 'none',
    borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 600,
  },
  iaThink: {
    color: palette.violetLight, fontSize: '0.85rem', margin: '-8px 0 0',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  iaDot: {
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', background: palette.violetLight,
    animation: 'pulse 1s ease-in-out infinite',
  },
  zoneJeu:  { display: 'flex', alignItems: 'center', gap: 24 },
  actions:  { display: 'flex', gap: 12, marginTop: 8 },
  modaleIcone:     { fontSize: '2rem', color: palette.violetLight, fontWeight: 'bold' },
  modaleTitre:     { color: palette.textPrimary, fontSize: '1.4rem', fontWeight: 'bold' },
  modaleSousTexte: { color: palette.textSub, textAlign: 'center', lineHeight: 1.6, fontSize: '0.9rem' },
  modaleJoueurs: {
    display: 'flex', alignItems: 'center', gap: 24,
    padding: '12px 24px', backgroundColor: palette.bg,
    borderRadius: 12, width: '100%', justifyContent: 'center',
  },
}
