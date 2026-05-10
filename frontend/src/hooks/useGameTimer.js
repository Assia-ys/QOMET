import { useState, useEffect } from 'react'

const DUREE_MAX_PAUSE = 60

export default function useGameTimer({ gagnant, pauseVisible, adversaireEnPause, onPauseExpire }) {
  const [startTime]                  = useState(() => Date.now())
  const [tempsJeu,    setTempsJeu]   = useState('00:00')
  const [dureePartie, setDureePartie] = useState('')
  const [tempsPause,  setTempsPause] = useState(DUREE_MAX_PAUSE)

  // Chronomètre principal (s'arrête en pause)
  useEffect(() => {
    if (gagnant || pauseVisible || adversaireEnPause) return
    const interval = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000)
      setTempsJeu(
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [gagnant, pauseVisible, adversaireEnPause, startTime])

  // Capture la durée finale à la fin de partie
  useEffect(() => {
    if (!gagnant) return
    setDureePartie(prev => prev || tempsJeu)
  }, [gagnant])

  // Compte à rebours de pause (60s max)
  useEffect(() => {
    if (!pauseVisible) { setTempsPause(DUREE_MAX_PAUSE); return }
    const interval = setInterval(() => {
      setTempsPause(prev => {
        if (prev <= 1) {
          onPauseExpire?.()
          return DUREE_MAX_PAUSE
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [pauseVisible])

  return { tempsJeu, dureePartie, tempsPause }
}
