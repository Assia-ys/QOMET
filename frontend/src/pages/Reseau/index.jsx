import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSocket, { getSocket, resetSocketToServer } from '../../hooks/useSocket'
import useGameStore from '../../store/useGameStore'
import { creerPartie, verifierPartie } from '../../api/parties'
import { SERVER_URL, LOCAL_URL } from '../../config/config'
import VueAccueil from './VueAccueil'
import SalleAttente from './SalleAttente'
import EcranErreur from './EcranErreur'

export default function Reseau() {
  const navigate = useNavigate()
  const socket   = useSocket()
  const { setMaCouleur, reinitialiser, setPrenomJoueur, setEtatServeur, setCodeRoom, setEtatPartie } = useGameStore()

  const [vue,        setVue]       = useState('accueil')
  const [codePartie, setCodePartie] = useState('')
  const [prenomHote, setPrenomHote] = useState('')
  const [isLoading,  setIsLoading]  = useState(false)

  useEffect(() => {
    const s       = getSocket()
    const handler = () => navigate('/jeu')
    s.on('partie_demarree', handler)
    return () => s.off('partie_demarree', handler)
  }, [])

  function connecterSocket(url) {
    const onDemarree = (data) => {
      setEtatServeur(data); setCodeRoom(data.code); setEtatPartie('en_cours'); navigate('/jeu')
    }
    if (url !== LOCAL_URL) {
      const s = resetSocketToServer(url)
      s.once('partie_demarree', onDemarree)
      return s
    }
    // Serveur local : reset si le socket pointait vers un serveur distant (ex: après une partie en joineur)
    const current = getSocket()
    if (current.io?.uri !== LOCAL_URL) {
      const s = resetSocketToServer(LOCAL_URL)
      s.once('partie_demarree', onDemarree)
      return s
    }
    return current
  }

  // SERVER_URL = window.location.origin en navigateur, LOCAL_URL en Electron
  async function handleCreer(prenom, serverURL = SERVER_URL) {
    if (isLoading) return
    setIsLoading(true)
    try {
      const data = await creerPartie(prenom, serverURL)
      const s    = connecterSocket(serverURL)
      reinitialiser()
      setMaCouleur('clair')
      setPrenomJoueur(prenom)
      if (!s.connected) s.connect()
      s.emit('rejoindre', { code: data.code, prenom })
      setCodePartie(data.code)
      setPrenomHote(prenom)
      setVue('attente')
    } catch {
      setVue('erreur')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRejoindre(prenom, code, serverURL = SERVER_URL) {
    if (isLoading) return
    setIsLoading(true)
    try {
      let resolvedURL = serverURL
      // En Electron sans IP manuelle : découverte automatique du serveur hôte
      if (window.electronAPI?.trouverServeur && serverURL === LOCAL_URL) {
        const found = await window.electronAPI.trouverServeur(code)
        if (!found) { setVue('erreur'); return }
        if (found === 'INVALID_CODE') { setVue('code_invalide'); return }
        resolvedURL = found
      }
      const s    = connecterSocket(resolvedURL)
      const data = await verifierPartie(code, resolvedURL)
      if (data.pleine) { setVue('erreur'); return }
      reinitialiser()
      setMaCouleur('fonce')
      setPrenomJoueur(prenom)
      if (!s.connected) s.connect()
      s.emit('rejoindre', { code, prenom })
    } catch {
      setVue('erreur')
    } finally {
      setIsLoading(false)
    }
  }

  if (vue === 'attente')       return <SalleAttente code={codePartie} prenom={prenomHote} onAnnuler={() => setVue('accueil')} />
  if (vue === 'erreur')        return <EcranErreur  onReessayer={() => setVue('accueil')} onRetour={() => setVue('accueil')} />
  if (vue === 'code_invalide') return <EcranErreur  onReessayer={() => setVue('accueil')} onRetour={() => setVue('accueil')} codeInvalide />
  return <VueAccueil onCreer={handleCreer} onRejoindre={handleRejoindre} isLoading={isLoading} />
}
