const CASES_JOUABLES = [
  [0,0], [0,3], [0,6],
  [1,1], [1,3], [1,5],
  [2,2], [2,3], [2,4],
  [3,0], [3,1], [3,2], [3,3], [3,4], [3,5], [3,6],
  [4,2], [4,3], [4,4],
  [5,1], [5,3], [5,5],
  [6,0], [6,3], [6,6],
]
import { useState, useRef, useEffect } from 'react'
import { SET_JOUABLES, EDGES } from '../utils/boardGeometry'

const CELL = 54
const GAP = 14
const PADDING = 36
const TAILLE = 7
const SVG_SIZE = PADDING * 2 + TAILLE * CELL + (TAILLE - 1) * GAP

const C = {
  videRemplir:   '#1e1b4b',
  videBord:      '#6d28d9',
  videGlow:      'rgba(124,58,237,0.2)',
  clair:         '#f59e0b',
  clairLight:    '#fbbf24',
  clairGlow:     'rgba(245,158,11,0.5)',
  fonce:         '#dc2626',
  fonceLight:    '#ef4444',
  fonceGlow:     'rgba(220,38,38,0.5)',
  selection:     '#a78bfa',
  selectionGlow: 'rgba(167,139,250,0.6)',
  coupValide:    '#34d399',
  coupValideGlow:'rgba(52,211,153,0.5)',
}

function cellCentre(r, c) {
  return {
    x: PADDING + c * (CELL + GAP) + CELL / 2,
    y: PADDING + r * (CELL + GAP) + CELL / 2,
  }
}

  if (valeur === "clair")      { background = '#facc15'; border = '#ca8a04' }
  else if (valeur === "fonce") { background = '#991b1b'; border = '#7f1d1d' }
  else if (coupValide)         { background = '#4ade80'; border = '#16a34a' }
  else if (selectionne)        { background = '#60a5fa'; border = '#2563eb' }
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

export default function Board({ plateau, selectionne, coupsValides = [], onCellClick, phase = 'pose' }) {
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

function Cellule({ valeur, selectionne, coupValide, phase, onClick }) {
  const [survol, setSurvol] = useState(false)
  const config = getConfig(valeur, selectionne, coupValide, phase, survol)
  const scale = selectionne ? 1.18 : survol && config.cursor === 'pointer' ? 1.1 : 1


  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{
        width: 48, height: 48,
        borderRadius: '50%',
        border: `2px solid ${border}`,
        background,
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: CELL, height: CELL,
        cursor: config.cursor,
        transform: `scale(${scale})`,
        transition: 'transform 0.15s ease, filter 0.15s ease',
        filter: config.glow ? `drop-shadow(0 0 8px ${config.glow})` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}
    >
      <EtoileSVG fill={config.fill} stroke={config.stroke} strokeWidth={config.strokeWidth} innerFill={config.innerFill} />
    </div>
  )
}

export function EtoileSVG({ fill, stroke, strokeWidth = 1.5, innerFill, size = 54 }) {
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
    </div>
    <svg width={size} height={size} viewBox="0 0 52 52">
      <polygon
        points="26,2 32,19 49,19 36,30 41,47 26,36 11,47 16,30 3,19 20,19"
        fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"
      />
      {innerFill && (
        <polygon
          points="26,12 29.5,22 40,22 31.5,28 34.5,39 26,33 17.5,39 20.5,28 12,22 22.5,22"
          fill={innerFill} opacity="0.25"
        />
      )}
    </svg>
  )
}

function getConfig(valeur, selectionne, coupValide, phase, survol) {
  if (selectionne)        return { fill: C.selection,  stroke: '#c4b5fd', strokeWidth: 2,   glow: C.selectionGlow,  innerFill: '#fff', cursor: 'pointer' }
  if (coupValide)         return { fill: survol ? '#6ee7b7' : C.coupValide, stroke: '#a7f3d0', strokeWidth: 1.5, glow: C.coupValideGlow, innerFill: '#fff', cursor: 'pointer' }
  if (valeur === 'clair') return { fill: survol ? C.clairLight : C.clair,  stroke: '#fde68a', strokeWidth: 1.5, glow: survol ? C.clairGlow : 'rgba(245,158,11,0.25)', innerFill: '#fff', cursor: 'pointer' }
  if (valeur === 'fonce') return { fill: survol ? C.fonceLight : C.fonce,  stroke: '#fca5a5', strokeWidth: 1.5, glow: survol ? C.fonceGlow : 'rgba(220,38,38,0.25)',  innerFill: '#fff', cursor: 'pointer' }
  if (survol && phase === 'pose') return { fill: '#2d1f5e', stroke: '#7c3aed', strokeWidth: 1.5, glow: 'rgba(124,58,237,0.4)', innerFill: null, cursor: 'pointer' }
  return { fill: C.videRemplir, stroke: C.videBord, strokeWidth: 1, glow: C.videGlow, innerFill: null, cursor: 'default' }
}

const styles = {
  wrapper: {
    padding: 6,
    borderRadius: 24,
    background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 50%, #0f172a 100%)',
    boxShadow: '0 0 40px rgba(124,58,237,0.3), 0 25px 60px rgba(0,0,0,0.6)',
  },
  board: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    gap: GAP, padding: PADDING,
    borderRadius: 20,
    border: '1px solid rgba(124,58,237,0.3)',
    background: 'radial-gradient(ellipse at center, #1e1320ff 0%, #180a1eff 100%)',
  },
  svg: { position: 'absolute', top: 0, left: 0, pointerEvents: 'none' },
  ligne: { display: 'flex', gap: GAP },
  invisible: { width: CELL, height: CELL },
}
