import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSocket, { getSocket, resetSocketToServer } from '../../hooks/useSocket'
import useGameStore from '../../store/useGameStore'
import { creerPartie, verifierPartie } from '../../api/parties'
import VueAccueil from './VueAccueil'
import SalleAttente from './SalleAttente'
import EcranErreur from './EcranErreur'

const LOCAL_URL = 'http://127.0.0.1:7777'

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
    // Toujours reset : si on était joineur sur une partie distante, le socket
    // global pointe encore vers le serveur distant. Reset garantit qu'on parle
    // au bon serveur (local ou distant selon url).
    const s = resetSocketToServer(url)
    s.once('partie_demarree', (data) => {
      setEtatServeur(data)
      setCodeRoom(data.code)
      setEtatPartie('en_cours')
      navigate('/jeu')
    })
    return s
  }

  async function handleCreer(prenom, serverURL = LOCAL_URL) {
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

  async function handleRejoindre(prenom, code, serverURL = LOCAL_URL) {
    if (isLoading) return
    setIsLoading(true)
    console.log('[Rejoindre] code:', code, '| electronAPI:', !!window.electronAPI, '| trouverServeur:', !!window.electronAPI?.trouverServeur)
    try {
      if (window.electronAPI?.getNetworkInfo) {
        const net = await window.electronAPI.getNetworkInfo()
        console.log('[Network] IPs locales:', net.localIPs, '| Subnets:', net.subnets, '| ARP:', net.arpIPs)
      }
      let resolvedURL = serverURL
      if (window.electronAPI?.trouverServeur && serverURL === LOCAL_URL) {
        console.log('[Rejoindre] Lancement découverte...')
        const found = await window.electronAPI.trouverServeur(code)
        console.log('[Rejoindre] Résultat découverte:', found)
        if (!found) { setVue('erreur'); return }
        resolvedURL = found
      }
      console.log('[Rejoindre] Connexion vers:', resolvedURL)
      const s    = connecterSocket(resolvedURL)
      const data = await verifierPartie(code, resolvedURL)
      console.log('[Rejoindre] verifierPartie:', data)
      if (data.pleine) { setVue('erreur'); return }
      reinitialiser()
      setMaCouleur('fonce')
      setPrenomJoueur(prenom)
      if (!s.connected) s.connect()
      s.emit('rejoindre', { code, prenom })
    } catch (err) {
      console.error('[Rejoindre] Erreur:', err?.message || err)
      setVue('erreur')
    } finally {
      setIsLoading(false)
    }
  }

  if (vue === 'attente') return <SalleAttente code={codePartie} prenom={prenomHote} onAnnuler={() => setVue('accueil')} />
  if (vue === 'erreur')  return <EcranErreur  onReessayer={() => setVue('accueil')} onRetour={() => setVue('accueil')} />
  return <VueAccueil onCreer={handleCreer} onRejoindre={handleRejoindre} isLoading={isLoading} />
}
