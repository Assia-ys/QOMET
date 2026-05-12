import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Board from '../components/game/Board'
import PlayerInfo from '../components/game/PlayerInfo'
import ModalFinPartie from '../components/game/ModalFinPartie'
import useGameStore from '../store/useGameStore'
import useSocket, { getSocketIA } from '../hooks/useSocket'
import useGameTimer from '../hooks/useGameTimer'
import useGameActions from '../hooks/useGameActions'
import BoutonRetour from '../components/layout/BoutonRetour'
import BoutonMenu from '../components/layout/BoutonMenu'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { playWin, playLose } from '../hooks/useSounds'
import { useLangue } from '../hooks/useLangue'
import { palette } from '../styles/palette'
import { styles, tempsRestantStyle } from '../styles/pages/Game.styles'
import useIsMobile from '../hooks/useIsMobile'

export default function Game() {
  const navigate  = useNavigate()
  const socket    = useSocket()
  const isMobile  = useIsMobile()
  const { t }     = useLangue()
  const g        = t.game

  const {
    plateau, joueurs, indexJoueurActif, niveauIA,
    selectionne, coupsValides, peutEjecter, gagnant, codeRoom, maCouleur,
    adversaireEnPause, cellulesGagnantes, prenomJoueur,
    selectionnerCase, setCoupsValides, setPeutEjecter,
  } = useGameStore()

  const actions = useGameActions(socket)

  const [pauseVisible,   setPauseVisible]   = useState(false)
  const [abandonVisible, setAbandonVisible] = useState(false)

  const { tempsJeu, dureePartie, tempsPause } = useGameTimer({
    gagnant, pauseVisible, adversaireEnPause,
    onPauseExpire: () => {
      setPauseVisible(false)
      if (codeRoom) actions.reprendre()
    },
  })

  const joueurActif = joueurs[indexJoueurActif]
  const modeIA      = joueurs.some(j => j?.nom === 'IA')
  const estTourIA   = modeIA && joueurActif?.nom === 'IA'
  const estMonTour  = !codeRoom || joueurActif?.couleur === maCouleur
  const phase       = joueurActif?.en_main > 0 ? 'pose' : 'deplacement'

  useEffect(() => {
    const { etatPartie, joueurs: j } = useGameStore.getState()
    if (etatPartie === 'en_attente' && j[1]?.nom !== 'IA') navigate('/')
  }, [])

  useEffect(() => {
    if (!gagnant) return
    const aGagne = !!gagnant.forfait || gagnant.nom === prenomJoueur
    const timer  = setTimeout(() => aGagne ? playWin() : playLose(), 250)
    return () => clearTimeout(timer)
  }, [gagnant])

  useEffect(() => {
    if (adversaireEnPause) setPauseVisible(true)
    else if (!adversaireEnPause && pauseVisible) setPauseVisible(false)
  }, [adversaireEnPause])

  useEffect(() => {
    if (!estTourIA || gagnant) return
    const delay = { facile: 600, moyen: 900, difficile: 1300 }[niveauIA] ?? 700
    const sIA   = getSocketIA()
    const timer = setTimeout(() => sIA.emit('coup_ia', { niveau: niveauIA }), delay)
    return () => clearTimeout(timer)
  }, [indexJoueurActif, gagnant, joueurs])

  function handleCellClick(r, c) {
    if (estTourIA || gagnant || !estMonTour) return
    const valeur = plateau[r][c]

    if (selectionne && coupsValides.some(([vr, vc]) => vr === r && vc === c)) {
      actions.jouerDeplacement(selectionne, [r, c])
      selectionnerCase(null, null); setCoupsValides([])
      return
    }
    if (selectionne && selectionne[0] === r && selectionne[1] === c) {
      selectionnerCase(null, null); setCoupsValides([]); setPeutEjecter(false)
      return
    }
    if (valeur === joueurActif?.couleur) {
      selectionnerCase(r, c); setCoupsValides([]); setPeutEjecter(false)
      actions.demanderCoups(r, c)
      return
    }
    if (!valeur && joueurActif?.en_main > 0) {
      actions.jouerPoser(r, c)
      return
    }
    selectionnerCase(null, null); setCoupsValides([])
  }

  function handleAbandonner() {
    actions.abandonner()
    navigate('/')
  }

  return (
    <div style={styles.page}>

      {gagnant && <ModalFinPartie gagnant={gagnant} duree={dureePartie} />}

      <BoutonRetour onClick={() => { actions.abandonner(); navigate(modeIA ? '/ia' : '/reseau') }} />

      <div style={styles.bandeau}>
        <span style={styles.bandeauTexte}>{joueurActif?.en_main > 0 ? g.poser_ou_deplacer : g.deplacer}</span>
        <span style={styles.chrono}>&#9203; {tempsJeu}</span>
      </div>

      {estTourIA && (
        <p style={styles.iaThink}>
          <span style={styles.iaDot} /> {g.ia_reflechit}
        </p>
      )}

      {isMobile && (
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-around' }}>
          <PlayerInfo joueur={joueurs[0]} estActif={indexJoueurActif === 0} estMoi={joueurs[0].couleur === maCouleur} niveauIA={joueurs[0]?.nom === 'IA' ? niveauIA : undefined} compact />
          <PlayerInfo joueur={joueurs[1]} estActif={indexJoueurActif === 1} estMoi={joueurs[1].couleur === maCouleur} niveauIA={joueurs[1]?.nom === 'IA' ? niveauIA : undefined} compact />
        </div>
      )}

      <div style={{ ...styles.zoneJeu, flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
        {!isMobile && <PlayerInfo joueur={joueurs[0]} estActif={indexJoueurActif === 0} estMoi={joueurs[0].couleur === maCouleur} niveauIA={joueurs[0]?.nom === 'IA' ? niveauIA : undefined} />}
        <Board
          plateau={plateau} selectionne={selectionne} coupsValides={coupsValides}
          onCellClick={handleCellClick} phase={phase}
          cellulesGagnantes={new Set(cellulesGagnantes.map(([r, c]) => `${r},${c}`))}
        />
        {!isMobile && <PlayerInfo joueur={joueurs[1]} estActif={indexJoueurActif === 1} estMoi={joueurs[1].couleur === maCouleur} niveauIA={joueurs[1]?.nom === 'IA' ? niveauIA : undefined} />}
      </div>

      {selectionne && peutEjecter && estMonTour && !estTourIA && (
        <div style={styles.ejecterBandeau}>
          <button style={styles.ejecterBtn} onClick={() => {
            actions.jouerEjecter(selectionne[0], selectionne[1])
            selectionnerCase(null, null); setCoupsValides([]); setPeutEjecter(false)
          }}>
            {g.sortir_plateau}
          </button>
        </div>
      )}

      <div style={styles.actions}>
        <BoutonMenu onClick={handleAbandonner} label="Menu" />
        {!modeIA && (
          <Button label={g.pause} couleur="#1e40af" onClick={() => {
            setPauseVisible(true)
            if (codeRoom) actions.mettreEnPause()
          }} />
        )}
        <Button label={g.abandonner} couleur="#dc2626" onClick={() => setAbandonVisible(true)} />
      </div>

      {pauseVisible && (
        <Modal>
          <div style={styles.modaleIcone}>II</div>
          <h2 style={styles.modaleTitre}>{g.pause_titre}</h2>
          <p style={styles.modaleSousTexte}>
            {adversaireEnPause ? g.pause_msg_adverse : g.pause_attente}
            <br />{g.pause_reprise_auto} : <strong style={tempsRestantStyle(tempsPause)}>{tempsPause}s</strong>
          </p>
          <div style={styles.modaleJoueurs}>
            <JoueurPause nom={joueurs[0].nom} label="Joueur 1" />
            <span style={styles.vs}>VS</span>
            <JoueurPause nom={joueurs[1].nom} label="Joueur 2" />
          </div>
          {!adversaireEnPause && (
            <Button label={g.reprendre} couleur={palette.violet} onClick={() => {
              setPauseVisible(false)
              if (codeRoom) actions.reprendre()
            }} />
          )}
          <BoutonMenu onClick={handleAbandonner} />
        </Modal>
      )}

      {abandonVisible && (
        <Modal>
          <div style={styles.abandonIcone}>!</div>
          <h2 style={styles.modaleTitre}>{g.abandon_titre}</h2>
          <p style={styles.modaleSousTexte}>{g.abandon_msg.split('\n')[0]}<br />{g.abandon_msg.split('\n')[1]}</p>
          <div style={styles.abandonActions}>
            <Button label={g.annuler}    couleur="#374151" onClick={() => setAbandonVisible(false)} />
            <Button label={g.abandonner} couleur="#dc2626" onClick={handleAbandonner} />
          </div>
        </Modal>
      )}

    </div>
  )
}

function JoueurPause({ nom, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={styles.joueurPauseNom}>{nom}</div>
      <div style={styles.joueurPauseLbl}>{label}</div>
    </div>
  )
}
