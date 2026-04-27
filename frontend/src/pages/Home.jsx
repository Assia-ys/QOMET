import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setChargement(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (chargement) return <EcranChargement />
  return <MenuPrincipal navigate={navigate} />
}

function EcranChargement() {
  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>QOMET</h1>
      <div style={styles.spinner} />
      <p style={styles.texteChargement}>Chargement...</p>
      <p style={styles.sousTexte}>● Initialisation des services...</p>
    </div>
  )
}

function MenuPrincipal({ navigate }) {
  return (
    <div style={styles.page}>
      <div style={styles.menuContainer}>
        <h1 style={styles.titre}>QOMET</h1>
        <p style={styles.sousTitre}>Menu Principal</p>

        <div style={styles.boutons}>
          <Bouton
            icone="📶"
            label="Jouer en réseau"
            couleur="#7c3aed"
            onClick={() => navigate('/reseau')}
          />
          <Bouton
            icone="🤖"
            label="Jouer contre IA"
            couleur="#7c3aed"
            onClick={() => navigate('/ia')}
          />
          <Bouton
            icone="⚙️"
            label="Paramètres"
            couleur="#374151"
            onClick={() => navigate('/parametres')}
          />
          <Bouton
            icone="↩"
            label="Quitter"
            couleur="#dc2626"
            onClick={() => window.close()}
          />
        </div>
      </div>
    </div>
  )
}

function Bouton({ icone, label, couleur, onClick }) {
  const [survol, setSurvol] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{
        ...styles.bouton,
        backgroundColor: survol ? couleur : couleur + 'cc',
        transform: survol ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <span style={styles.icone}>{icone}</span>
      {label}
    </button>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
  },
  menuContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  titre: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#a78bfa',
    letterSpacing: '0.2em',
    marginBottom: '4px',
  },
  sousTitre: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginBottom: '32px',
    letterSpacing: '0.1em',
  },
  boutons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '280px',
  },
  bouton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px 24px',
    borderRadius: '8px',
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  icone: {
    fontSize: '1.1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #334155',
    borderTop: '4px solid #a78bfa',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '24px 0 16px',
  },
  texteChargement: {
    color: '#94a3b8',
    fontSize: '1rem',
    marginBottom: '8px',
  },
  sousTexte: {
    color: '#4ade80',
    fontSize: '0.85rem',
  },
}
