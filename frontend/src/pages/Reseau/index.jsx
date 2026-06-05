import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSocket, { getSocket, resetSocketToServer } from '../../hooks/useSocket'
import useGameStore from '../../store/useGameStore'
import { creerPartie, verifierPartie } from '../../api/parties'
import { SERVER_URL, LOCAL_URL, ONLINE_URL, IS_ELECTRON } from '../../config/config'
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
    // En Electron, toujours revenir au serveur local quand on entre sur la page réseau
    if (IS_ELECTRON) {
      const current = getSocket()
      if (current.io?.uri !== LOCAL_URL) {
        current.disconnect()
        resetSocketToServer(LOCAL_URL)
      }
    }
  }, [])

  function resetSocketLocal() {
    const current = getSocket()
    if (current.io?.uri !== LOCAL_URL) {
      current.disconnect()
      resetSocketToServer(LOCAL_URL)
    }
  }

  function connecterSocket(url) {
    const onDemarree = (data) => {
      window.electronAPI?.arreterBroadcast?.()
      setEtatServeur(data); setCodeRoom(data.code); setEtatPartie('en_cours'); navigate('/jeu')
    }
    const s = resetSocketToServer(url)
    s.once('partie_demarree', onDemarree)
    return s
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
      // Broadcast UDP + enregistrement Railway avec la MÊME IP (celle retournée par le broadcast)
      if (serverURL === LOCAL_URL && window.electronAPI?.demarrerBroadcast) {
        window.electronAPI.demarrerBroadcast(data.code)
          .then(broadcastIP => {
            if (!broadcastIP) return
            fetch(`${ONLINE_URL}/local/register`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ code: data.code, ip: broadcastIP, port: 7777 }),
            }).catch(() => {})
          })
          .catch(() => {})
      }
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
        // Essai via signaling Railway (fonctionne sur tout réseau, instant)
        let signalingURL = null
        try {
          const res = await fetch(`${ONLINE_URL}/local/find/${code.toUpperCase()}`, {
            signal: AbortSignal.timeout(4000),
          })
          if (res.ok) {
            const info = await res.json()
            if (info.ip && info.ip !== '127.0.0.1') {
              signalingURL = `http://${info.ip}:${info.port}`
            }
          }
        } catch {}

        if (signalingURL) {
          resolvedURL = signalingURL
        } else {
          const found = await window.electronAPI.trouverServeur(code)
          if (!found) { resetSocketLocal(); setVue('erreur'); return }
          if (found === 'INVALID_CODE') { resetSocketLocal(); setVue('code_invalide'); return }
          resolvedURL = found
        }
      }

      // Si Railway avait fourni l'IP mais qu'elle ne répond pas → fallback découverte locale
      let data
      try {
        data = await verifierPartie(code, resolvedURL)
      } catch {
        if (signalingURL && window.electronAPI?.trouverServeur) {
          const found = await window.electronAPI.trouverServeur(code)
          if (!found) { resetSocketLocal(); setVue('erreur'); return }
          if (found === 'INVALID_CODE') { resetSocketLocal(); setVue('code_invalide'); return }
          resolvedURL = found
          data = await verifierPartie(code, resolvedURL)
        } else {
          throw new Error('verifierPartie échouée')
        }
      }

      if (data.pleine) { setVue('erreur'); return }
      reinitialiser()
      setMaCouleur('fonce')
      setPrenomJoueur(prenom)
      const s = connecterSocket(resolvedURL)
      if (!s.connected) s.connect()
      s.emit('rejoindre', { code, prenom })
    } catch (err) {
      resetSocketLocal()
      setVue('erreur')
    } finally {
      setIsLoading(false)
    }
  }

  if (vue === 'attente')       return <SalleAttente code={codePartie} prenom={prenomHote} onAnnuler={() => { window.electronAPI?.arreterBroadcast?.(); setVue('accueil') }} isLocal={!!window.electronAPI} />
  if (vue === 'erreur')        return <EcranErreur  onReessayer={() => { resetSocketLocal(); setVue('accueil') }} onRetour={() => { resetSocketLocal(); setVue('accueil') }} />
  if (vue === 'code_invalide') return <EcranErreur  onReessayer={() => { resetSocketLocal(); setVue('accueil') }} onRetour={() => { resetSocketLocal(); setVue('accueil') }} codeInvalide />
  return <VueAccueil onCreer={handleCreer} onRejoindre={handleRejoindre} isLoading={isLoading} />
}
