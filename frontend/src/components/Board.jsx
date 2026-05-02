<<<<<<< Updated upstream
const CASES_JOUABLES = [
  [0,0], [0,3], [0,6],
  [1,1], [1,3], [1,5],
  [2,2], [2,3], [2,4],
  [3,0], [3,1], [3,2], [3,3], [3,4], [3,5], [3,6],
  [4,2], [4,3], [4,4],
  [5,1], [5,3], [5,5],
  [6,0], [6,3], [6,6],
]
=======
import { useState, useRef, useEffect } from 'react'
import { SET_JOUABLES, EDGES } from '../utils/boardGeometry'
>>>>>>> Stashed changes

const TAILLE = 7

function Cell({ valeur, selectionne, coupValide, onClick }) {
  let background = '#374151'
  let border = '#6b7280'

<<<<<<< Updated upstream
  if (valeur === "clair")      { background = '#facc15'; border = '#ca8a04' }
  else if (valeur === "fonce") { background = '#991b1b'; border = '#7f1d1d' }
  else if (coupValide)         { background = '#4ade80'; border = '#16a34a' }
  else if (selectionne)        { background = '#60a5fa'; border = '#2563eb' }
=======
function cellCentre(r, c) {
  return {
    x: PADDING + c * (CELL + GAP) + CELL / 2,
    y: PADDING + r * (CELL + GAP) + CELL / 2,
  }
}

export default function Board({ plateau, selectionne, coupsValides = [], onCellClick, phase = 'pose', cellulesGagnantes = new Set() }) {
  const prevPlateauRef = useRef(plateau)
  const [animIn, setAnimIn]       = useState(new Set())
  const [ghostStars, setGhostStars] = useState({})

  useEffect(() => {
    const prev = prevPlateauRef.current
    if (prev === plateau) return

    const newIn     = new Set()
    const newGhosts = {}

    for (const key of SET_JOUABLES) {
      const [r, c] = key.split(',').map(Number)
      const prevVal = prev?.[r]?.[c] ?? null
      const currVal = plateau?.[r]?.[c] ?? null
      if (prevVal === null && currVal !== null) newIn.add(key)
      if (prevVal !== null && currVal === null) newGhosts[key] = prevVal
    }

    prevPlateauRef.current = plateau

    const cleanups = []
    if (newIn.size > 0) {
      setAnimIn(newIn)
      const t = setTimeout(() => setAnimIn(new Set()), 400)
      cleanups.push(() => clearTimeout(t))
    }
    if (Object.keys(newGhosts).length > 0) {
      setGhostStars(newGhosts)
      const t = setTimeout(() => setGhostStars({}), 400)
      cleanups.push(() => clearTimeout(t))
    }

    return () => cleanups.forEach(fn => fn())
  }, [plateau])

  const estJouable     = (r, c) => SET_JOUABLES.has(`${r},${c}`)
  const estSelectionne = (r, c) => selectionne?.[0] === r && selectionne?.[1] === c
  const estCoupValide  = (r, c) => coupsValides.some(([vr, vc]) => vr === r && vc === c)

  return (
    <div style={styles.wrapper}>
      <div style={styles.board}>

        <svg width={SVG_SIZE} height={SVG_SIZE} style={styles.svg}>
          {EDGES.map(([[r1, c1], [r2, c2]], i) => {
            const a = cellCentre(r1, c1)
            const b = cellCentre(r2, c2)
            const actif = selectionne &&
              ((selectionne[0] === r1 && selectionne[1] === c1) ||
               (selectionne[0] === r2 && selectionne[1] === c2))
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={actif ? '#a78bfa' : '#6d28d9'}
                strokeWidth={actif ? 2 : 1.5}
                opacity={actif ? 1 : 0.6}
              />
            )
          })}
        </svg>

        {Array.from({ length: TAILLE }, (_, r) => (
          <div key={r} style={styles.ligne}>
            {Array.from({ length: TAILLE }, (_, c) => {
              if (!estJouable(r, c)) return <div key={c} style={styles.invisible} />
              const key = `${r},${c}`
              return (
                <Cellule
                  key={c}
                  valeur={plateau?.[r]?.[c] ?? null}
                  selectionne={estSelectionne(r, c)}
                  coupValide={estCoupValide(r, c)}
                  phase={phase}
                  onClick={() => onCellClick?.(r, c)}
                  animIn={animIn.has(key)}
                  estGagnante={cellulesGagnantes.has(key)}
                />
              )
            })}
          </div>
        ))}

        {/* Ghost stars — animation d'éjection/départ */}
        {Object.entries(ghostStars).map(([key, color]) => {
          const [r, c] = key.split(',').map(Number)
          const fill   = color === 'clair' ? C.clair  : C.fonce
          const stroke = color === 'clair' ? '#fde68a' : '#fca5a5'
          const glow   = color === 'clair' ? C.clairGlow : C.fonceGlow
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top:  PADDING + r * (CELL + GAP),
                left: PADDING + c * (CELL + GAP),
                width: CELL, height: CELL,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'starOut 0.4s ease-out forwards',
                filter: `drop-shadow(0 0 10px ${glow})`,
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <EtoileSVG fill={fill} stroke={stroke} strokeWidth={1.5} innerFill="#fff" />
            </div>
          )
        })}

      </div>
    </div>
  )
}

function Cellule({ valeur, selectionne, coupValide, phase, onClick, animIn = false, estGagnante = false }) {
  const [survol, setSurvol] = useState(false)
  const config = getConfig(valeur, selectionne, coupValide, phase, survol)
  const scale  = selectionne ? 1.18 : survol && config.cursor === 'pointer' ? 1.1 : 1

  // Filtre externe supprimé quand l'animation interne gère le glow
  const outerFilter = (estGagnante && valeur) ? 'none' : (config.glow ? `drop-shadow(0 0 8px ${config.glow})` : 'none')

  const innerAnim =
    animIn                    ? 'starPop 0.35s ease-out forwards' :
    (estGagnante && valeur)   ? 'winPulse 1.2s ease-in-out infinite' :
    undefined
>>>>>>> Stashed changes

  return (
    <div
      onClick={onClick}
      style={{
<<<<<<< Updated upstream
        width: 48, height: 48,
        borderRadius: '50%',
        border: `2px solid ${border}`,
        background,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    />
  )
}

export default function Board({ grille, selectionne, coupsValides, onCellClick }) {
  const estJouable = (r, c) =>
    CASES_JOUABLES.some(([jr, jc]) => jr === r && jc === c)

  const estCoupValide = (r, c) =>
    coupsValides?.some(([vr, vc]) => vr === r && vc === c)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 32,
      background: '#111827',
      borderRadius: 16,
    }}>
      {Array.from({ length: TAILLE }, (_, r) => (
        <div key={r} style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: TAILLE }, (_, c) => {
            if (!estJouable(r, c)) {
              return <div key={c} style={{ width: 48, height: 48 }} />
            }
            const valeur = grille?.[r]?.[c] ?? null
            const estSel = selectionne?.[0] === r && selectionne?.[1] === c
            return (
              <Cell
                key={c}
                valeur={valeur}
                selectionne={estSel}
                coupValide={estCoupValide(r, c)}
                onClick={() => onCellClick(r, c)}
              />
            )
          })}
        </div>
      ))}
=======
        width: CELL, height: CELL,
        cursor: config.cursor,
        transform: `scale(${scale})`,
        transition: 'transform 0.15s ease, filter 0.15s ease',
        filter: outerFilter,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}
    >
      <div style={innerAnim ? { animation: innerAnim } : undefined}>
        <EtoileSVG fill={config.fill} stroke={config.stroke} strokeWidth={config.strokeWidth} innerFill={config.innerFill} />
      </div>
>>>>>>> Stashed changes
    </div>
  )
}