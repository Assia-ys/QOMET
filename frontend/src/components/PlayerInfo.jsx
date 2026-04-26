export default function PlayerInfo({ joueur, estActif }) {
  return (
    <div style={{
      padding: 20,
      borderRadius: 12,
      background: estActif ? '#1e3a5f' : '#111827',
      border: `2px solid ${estActif ? '#3b82f6' : '#1f2937'}`,
      minWidth: 180,
      transition: 'all 0.3s',
    }}>
      {/* Indicateur de tour */}
      {estActif && (
        <div style={{
          background: '#3b82f6',
          color: 'white',
          fontSize: 11,
          fontWeight: 'bold',
          padding: '3px 10px',
          borderRadius: 20,
          display: 'inline-block',
          marginBottom: 10,
          letterSpacing: 1,
        }}>
          TON TOUR
        </div>
      )}

      {/* Nom + couleur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: joueur.couleur === 'clair' ? '#facc15' : '#991b1b',
          border: '2px solid #374151',
          flexShrink: 0,
        }} />
        <span style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16,
        }}>
          {joueur.nom}
        </span>
      </div>

      {/* Étoiles en main */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
          EN MAIN
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: i < joueur.en_main
                ? (joueur.couleur === 'clair' ? '#facc15' : '#991b1b')
                : '#1f2937',
              border: '1px solid #374151',
            }} />
          ))}
        </div>
      </div>

      {/* Étoiles sur le plateau */}
      <div>
        <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
          SUR LE PLATEAU
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: i < joueur.sur_plateau
                ? (joueur.couleur === 'clair' ? '#facc15' : '#991b1b')
                : '#1f2937',
              border: '1px solid #374151',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}