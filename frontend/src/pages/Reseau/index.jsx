import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSocket, { getSocket } from '../../hooks/useSocket'
import useGameStore from '../../store/useGameStore'
import { creerPartie, verifierPartie } from '../../api/parties'
import VueAccueil from './VueAccueil'
import SalleAttente from './SalleAttente'
import EcranErreur from './EcranErreur'

export default function Reseau() {
  const navigate = useNavigate()
  const socket   = useSocket()
  const { setMaCouleur, reinitialiser, setPrenomJoueur } = useGameStore()

  const [vue,         setVue]         = useState('accueil')
  const [codePartie,  setCodePartie]  = useState('')
  const [prenomHote,  setPrenomHote]  = useState('')
  const [isLoading,   setIsLoading]   = useState(false)

  // Navigation automatique quand la partie démarre
  useEffect(() => {
    const s       = getSocket()
    const handler = () => navigate('/jeu')
    s.on('partie_demarree', handler)
    return () => s.off('partie_demarree', handler)
  }, [])

  async function handleCreer(prenom) {
    if (isLoading) return
    setIsLoading(true)
    try {
      const data = await creerPartie(prenom)
      reinitialiser()
      setMaCouleur('clair')
      setPrenomJoueur(prenom)
      socket.emit('rejoindre', { code: data.code, prenom })
      setCodePartie(data.code)
      setPrenomHote(prenom)
      setVue('attente')
    } catch {
      setVue('erreur')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRejoindre(prenom, code) {
    if (isLoading) return
    setIsLoading(true)
    try {
      const data = await verifierPartie(code)
      if (data.pleine) { setVue('erreur'); return }
      reinitialiser()
      setMaCouleur('fonce')
      setPrenomJoueur(prenom)
      socket.emit('rejoindre', { code, prenom })
    } catch {
      setVue('erreur')
    } finally {
      setIsLoading(false)
    }
  }

  if (vue === 'attente') return <SalleAttente code={codePartie} prenom={prenomHote} onAnnuler={() => setVue('accueil')} />
  if (vue === 'erreur')  return <EcranErreur  onReessayer={() => setVue('accueil')} onRetour={() => setVue('accueil')} />
  return <VueAccueil onCreer={handleCreer} onRejoindre={handleRejoindre} isLoading={isLoading} />
}
