import { EtoileSVG } from './Board'

const COULEURS = {
  clair: { fill: '#f59e0b', stroke: '#fde68a' },
  fonce: { fill: '#dc2626', stroke: '#fca5a5' },
}

export default function PlayerInfo({ joueur, estActif }) {
  const { fill, stroke } = COULEURS[joueur.couleur]

  return (
    <div style={{
      padding: 20, borderRadius: 12, minWidth: 180, transition: 'all 0.3s',
      background: estActif ? '#1e293b' : '#111827',
      border: `2px solid ${estActif ? '#7c3aed' : '#1f2937'}`,
    }}>

      {estActif && (
        <div style={{
          background: '#7c3aed', color: 'white',
          fontSize: 11, fontWeight: 'bold',
          padding: '3px 10px', borderRadius: 20,
          display: 'inline-block', marginBottom: 10, letterSpacing: 1,
        }}>
          TON TOUR
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <EtoileSVG fill={fill} stroke={stroke} strokeWidth={1.5} innerFill="#fff" size={28} />
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
          {joueur.nom}
        </span>
      </div>

      <Compteur label="EN MAIN"       count={joueur.en_main}      fill={fill} stroke={stroke} />
      <Compteur label="SUR LE PLATEAU" count={joueur.sur_plateau}  fill={fill} stroke={stroke} />

    </div>
  )
}

function Compteur({ label, count, fill, stroke }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Array.from({ length: 7 }, (_, i) => (
          <EtoileSVG
            key={i}
            fill={i < count ? fill : '#1f2937'}
            stroke={i < count ? stroke : '#374151'}
            strokeWidth={1}
            innerFill={i < count ? '#fff' : null}
            size={20}
          />
        ))}
      </div>
    </div>
  )
}
