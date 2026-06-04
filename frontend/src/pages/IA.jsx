import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/useGameStore'
import { getSocket, getSocketIA } from '../hooks/useSocket'
import { Sparkles, Zap, Flame } from 'lucide-react'
import BoutonRetour from '../components/layout/BoutonRetour'
import { useTranslation } from 'react-i18next'
import { creerPartie } from '../api/parties'
import { palette } from '../styles/palette'
import { styles, carteNiveauStyle, cocheStyle, badgeNiveauStyle, boutonCommencerStyle } from '../styles/pages/IA.styles'

export default function IA() {
  const navigate = useNavigate()
  const { t }    = useTranslation()
  const { reinitialiser, setConfigIA, setMaCouleur, setCodeRoom, setEtatServeur } = useGameStore()

  const NIVEAUX = [
    { id: 'facile',    label: t('ia.facile'),    badge: t('ia.facile_badge'),    description: t('ia.facile_desc'),    icon: <Sparkles size={32} />, couleur: 'green'  },
    { id: 'moyen',     label: t('ia.moyen'),     badge: t('ia.moyen_badge'),     description: t('ia.moyen_desc'),     icon: <Zap      size={32} />, couleur: 'orange' },
    { id: 'difficile', label: t('ia.difficile'), badge: t('ia.difficile_badge'), description: t('ia.difficile_desc'), icon: <Flame    size={32} />, couleur: 'red'    },
  ]

  const [niveauChoisi, setNiveauChoisi] = useState('facile')
  const [prenom,       setPrenom]       = useState('')
  const [chargement,   setChargement]   = useState(false)

  async function commencer() {
    if (!prenom.trim() || chargement) return
    setChargement(true)
    reinitialiser()
    setConfigIA(niveauChoisi, prenom.trim())

    try {
      const data = await creerPartie(prenom.trim())
      const code = data.code
      const s    = getSocket()
      const sIA  = getSocketIA()
      if (!s.connected)   s.connect()
      if (!sIA.connected) sIA.connect()

      setCodeRoom(code)

      // La couleur est lue depuis la réponse serveur pour éviter la race condition
      // (l'ordre d'arrivée des sockets n'est pas garanti)
      s.once('partie_demarree', (d) => {
        const joueurHumain = d.joueurs?.find(j => j.nom === prenom.trim())
        if (joueurHumain) setMaCouleur(joueurHumain.couleur)
        setEtatServeur(d)
        navigate('/jeu')
      })

      // On envoie les deux join, l'ordre côté serveur détermine les couleurs
      const iaCommence = Math.random() < 0.5
      if (iaCommence) {
        sIA.emit('rejoindre', { code, prenom: 'IA' })
        s.emit('rejoindre',   { code, prenom: prenom.trim() })
      } else {
        s.emit('rejoindre',   { code, prenom: prenom.trim() })
        sIA.emit('rejoindre', { code, prenom: 'IA' })
      }
    } catch (e) {
      console.error('Erreur création partie IA:', e)
      setChargement(false)
    }
  }

  return (
    <div style={styles.page}>
      <BoutonRetour onClick={() => navigate('/')} />
      <h1 style={styles.titre}>{t('ia.titre')}</h1>
      <p style={styles.sous}>{t('ia.sous')}</p>

      <div style={styles.grille}>
        {NIVEAUX.map((n) => (
          <CarteNiveau key={n.id} niveau={n} selectionne={niveauChoisi === n.id} onClick={() => setNiveauChoisi(n.id)} />
        ))}
      </div>

      <div style={styles.champ}>
        <label style={styles.label}>{t('ia.prenom')}</label>
        <input
          style={styles.input}
          placeholder={t('ia.prenom_placeholder')}
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commencer()}
        />
      </div>

      <button
        style={boutonCommencerStyle(!!prenom.trim() && !chargement)}
        onClick={commencer}
        disabled={!prenom.trim() || chargement}
      >
        {chargement ? t('ia.connexion') : t('ia.commencer')}
      </button>
    </div>
  )
}

function CarteNiveau({ niveau, selectionne, onClick }) {
  const couleurMap = { green: palette.green, orange: palette.orange, red: palette.red }
  const bordure    = couleurMap[niveau.couleur]

  return (
    <div onClick={onClick} style={carteNiveauStyle(selectionne, bordure)}>
      {selectionne && <span style={cocheStyle(bordure)}>&#10003;</span>}
      <div style={{ ...styles.iconeRow, color: bordure }}>{niveau.icon}</div>
      <strong style={styles.nom}>{niveau.label}</strong>
      <span style={badgeNiveauStyle(bordure)}>{niveau.badge}</span>
      <p style={styles.desc}>{niveau.description}</p>
    </div>
  )
}