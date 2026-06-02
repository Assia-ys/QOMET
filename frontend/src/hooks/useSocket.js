import { useEffect } from 'react'
import { io } from 'socket.io-client'
import useGameStore from '../store/useGameStore'
import { SERVER_URL } from '../config/config'

let socket   = null
let socketIA = null

export function getSocket() {
  if (!socket) socket = io(SERVER_URL, { autoConnect: false })
  return socket
}

export function getSocketIA() {
  if (!socketIA) socketIA = io(SERVER_URL, { autoConnect: false })
  return socketIA
}

// Recrée le socket vers un serveur distant (mode réseau 2 machines)
export function resetSocketToServer(serverUrl) {
  if (socket) { socket.disconnect(); socket = null }
  socket = io(serverUrl, { autoConnect: false })
  return socket
}

export default function useSocket() {
  const { setEtatServeur, setCodeRoom, setEtatPartie, setGagnant, setCoupsValides, setPeutEjecter, setAdversaireEnPause, setCellulesGagnantes } = useGameStore()

  useEffect(() => {
    const s = getSocket()
    if (!s.connected) s.connect()

    function onEtat(data)           { setEtatServeur(data) }
    function onPartieDemarree(data) { setEtatServeur(data); setCodeRoom(data.code); setEtatPartie('en_cours') }
    function onRoomRejointe(data)   { setCodeRoom(data.code) }
    function onCarreGagnant(data)   { setCellulesGagnantes(data.cellules || []) }
    function onFinPartie(data)      { setGagnant({ nom: data.gagnant }); setEtatPartie('terminee') }
    function onCoupsValides(data)   { setCoupsValides(data.destinations || []); setPeutEjecter(data.peut_ejecter || false) }
    function onAdversaireDeconnecte() {
      const { prenomJoueur } = useGameStore.getState()
      setAdversaireEnPause(false)
      setGagnant({ nom: prenomJoueur, forfait: true })
      setEtatPartie('terminee')
    }
    function onAdversaireEnPause()  { setAdversaireEnPause(true) }
    function onAdversaireARepris()  { setAdversaireEnPause(false) }
    function onErreur(data)         { console.error('[Socket] Erreur :', data.code, data.msg || '') }

    s.on('etat',                  onEtat)
    s.on('partie_demarree',       onPartieDemarree)
    s.on('room_rejointe',         onRoomRejointe)
    s.on('carre_gagnant',         onCarreGagnant)
    s.on('fin_partie',            onFinPartie)
    s.on('coups_valides',         onCoupsValides)
    s.on('adversaire_deconnecte', onAdversaireDeconnecte)
    s.on('adversaire_en_pause',   onAdversaireEnPause)
    s.on('adversaire_a_repris',   onAdversaireARepris)
    s.on('erreur',                onErreur)

    return () => {
      s.off('etat',                  onEtat)
      s.off('partie_demarree',       onPartieDemarree)
      s.off('room_rejointe',         onRoomRejointe)
      s.off('carre_gagnant',         onCarreGagnant)
      s.off('fin_partie',            onFinPartie)
      s.off('coups_valides',         onCoupsValides)
      s.off('adversaire_deconnecte', onAdversaireDeconnecte)
      s.off('adversaire_en_pause',   onAdversaireEnPause)
      s.off('adversaire_a_repris',   onAdversaireARepris)
      s.off('erreur',                onErreur)
    }
  }, [])

  return getSocket()
}
