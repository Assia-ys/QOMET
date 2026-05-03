import { useEffect } from 'react'
import { io } from 'socket.io-client'
import useGameStore from '../store/useGameStore'

const SERVER_URL = 'http://127.0.0.1:7777'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, { autoConnect: false })
  }
  return socket
}

export default function useSocket() {
  const { setEtatServeur, setCodeRoom, setEtatPartie, setGagnant, setCoupsValides } = useGameStore()

  useEffect(() => {
    const s = getSocket()
    if (!s.connected) s.connect()

    function onEtat(data)               { setEtatServeur(data) }
    function onPartieDemarree(data)     { setEtatServeur(data); setCodeRoom(data.code); setEtatPartie('en_cours') }
    function onRoomRejointe(data)       { setCodeRoom(data.code) }
    function onFinPartie(data)          { setGagnant({ nom: data.gagnant }); setEtatPartie('terminee') }
    function onCoupsValides(data) {

      setCoupsValides(data.destinations || [])
    }

    function onAdversaireDeconnecte() {
      const { prenomJoueur } = useGameStore.getState()
      setGagnant({ nom: prenomJoueur, forfait: true })
      setEtatPartie('terminee')
    }

    function onErreur(data) {
      console.error('[Socket] Erreur :', data.code, data.msg || '')
    }

    s.on('etat',                  onEtat)
    s.on('partie_demarree',       onPartieDemarree)
    s.on('room_rejointe',         onRoomRejointe)
    s.on('fin_partie',            onFinPartie)
    s.on('coups_valides',         onCoupsValides)
    s.on('adversaire_deconnecte', onAdversaireDeconnecte)
    s.on('erreur',                onErreur)

    return () => {
      s.off('etat',                  onEtat)
      s.off('partie_demarree',       onPartieDemarree)
      s.off('room_rejointe',         onRoomRejointe)
      s.off('fin_partie',            onFinPartie)
      s.off('coups_valides',         onCoupsValides)
      s.off('adversaire_deconnecte', onAdversaireDeconnecte)
      s.off('erreur',                onErreur)
    }
  }, [])

  return getSocket()
}
