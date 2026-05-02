<<<<<<< Updated upstream
import PagePlaceholder from '../components/PagePlaceholder'

export default function Game() {
  return <PagePlaceholder nom="Jeu" route="/jeu" />
=======
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Board from '../components/Board'
import PlayerInfo from '../components/PlayerInfo'
import useGameStore from '../store/useGameStore'
import { getCasesAccessibles, appliquerMouvement, detecterCarreGagnant } from '../utils/rulesClient'

export default function Game() {
  const navigate = useNavigate()
  const {
    plateau, joueurs, indexJoueurActif,
    selectionne, coupsValides,
    selectionnerCase, setCoupsValides, setPlateau, changerTour, poserEtoile, recupererEtoile,
  } = useGameStore()

  const [phase, setPhase] = useState('pose')
  const [pauseVisible, setPauseVisible] = useState(false)
  const [abandonVisible, setAbandonVisible] = useState(false)
  const [cellulesGagnantes, setCellulesGagnantes] = useState(new Set())

  function mettreAJourVictoire(nouvPlateau) {
    const resultat = detecterCarreGagnant(nouvPlateau)
    setCellulesGagnantes(resultat
      ? new Set(resultat.cellules.map(([r, c]) => `${r},${c}`))
      : new Set()
    )
  }

  const joueurActif = joueurs[indexJoueurActif]

  function handleCellClick(r, c) {
    const valeur = plateau[r][c]

    // Clic sur un coup valide → déplacer
    if (selectionne && coupsValides.some(([vr, vc]) => vr === r && vc === c)) {
      const { nouveauPlateau, etoileEjectee } = appliquerMouvement(plateau, selectionne[0], selectionne[1], r, c)
      setPlateau(nouveauPlateau)
      mettreAJourVictoire(nouveauPlateau)
      if (etoileEjectee) recupererEtoile(etoileEjectee)
      selectionnerCase(null, null)
      setCoupsValides([])
      changerTour()
      return
    }

    // Clic sur son étoile → sélectionner et afficher les coups
    if (valeur === joueurActif.couleur && phase === 'deplacement') {
      selectionnerCase(r, c)
      setCoupsValides(getCasesAccessibles(plateau, r, c))
      return
    }

    // Clic sur case vide en mode pose
    if (phase === 'pose' && !valeur && joueurActif.en_main > 0) {
      const nouveau = plateau.map(row => [...row])
      nouveau[r][c] = joueurActif.couleur
      setPlateau(nouveau)
      mettreAJourVictoire(nouveau)
      poserEtoile(indexJoueurActif)
      changerTour()
      return
    }

    // Clic ailleurs → désélectionner
    selectionnerCase(null, null)
    setCoupsValides([])
  }

  function changerPhase(nouvellePhase) {
    setPhase(nouvellePhase)
    selectionnerCase(null, null)
    setCoupsValides([])
  }

  return (
    <div style={styles.page}>

      <div style={styles.bandeau}>
        <span style={styles.bandeauTexte}>
          {phase === 'pose' ? '⭐ Phase de pose' : '↔ Phase de déplacement'}
        </span>
        <div style={styles.switchPhase}>
          <BoutonPhase label="Poser"    actif={phase === 'pose'}        onClick={() => changerPhase('pose')} />
          <BoutonPhase label="Déplacer" actif={phase === 'deplacement'} onClick={() => changerPhase('deplacement')} />
        </div>
      </div>

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
        <BoutonAction label="⏸ Pause"      couleur="#1e40af" onClick={() => setPauseVisible(true)} />
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
>>>>>>> Stashed changes
}
