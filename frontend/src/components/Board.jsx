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

const SLIDE_MS = 340

export default function Board({ plateau, selectionne, coupsValides = [], onCellClick, phase = 'pose', cellulesGagnantes = new Set() }) {
  const prevPlateauRef = useRef(plateau)
  const [animIn, setAnimIn]           = useState(new Set())
  const [movingStars, setMovingStars]   = useState([])
  const [hiddenCells, setHiddenCells]   = useState(new Set())
  const [arrivedCells, setArrivedCells] = useState(new Set())
  const [ejectStars, setEjectStars]     = useState([])  // éjections avec direction + anneau

  useEffect(() => {
    const prev = prevPlateauRef.current
    if (prev === plateau) return
    prevPlateauRef.current = plateau

    // Collecter les cellules qui ont perdu / gagné une pièce
    const disparu  = {}  // couleur → [{r, c, key}]
    const apparu   = {}  // couleur → [{r, c, key}]

    for (const key of SET_JOUABLES) {
      const [r, c] = key.split(',').map(Number)
      const prev_ = prev?.[r]?.[c] ?? null
      const curr  = plateau?.[r]?.[c] ?? null

      if (prev_ === curr) continue

      if (prev_ !== null) (disparu[prev_] ??= []).push({ r, c, key })  // pièce partie
      if (curr  !== null) (apparu[curr]   ??= []).push({ r, c, key })  // pièce arrivée
      // Les deux conditions couvrent aussi valeurA→valeurB (pousser : B passe de fonce→clair)
    }

    const moves    = []  // { id, fromR, fromC, toR, toC, destKey, color }
    const ghosts   = {}  // cellules éjectées
    const popKeys  = new Set() // nouvelles poses

    for (const color of ['clair', 'fonce']) {
      const srcs = disparu[color] || []
      const dsts = apparu[color]  || []
      const n    = Math.min(srcs.length, dsts.length)
      for (let i = 0; i < n; i++) {
        moves.push({
          id:      `${srcs[i].key}->${dsts[i].key}`,
          fromR:   srcs[i].r,  fromC: srcs[i].c,
          toR:     dsts[i].r,  toC:   dsts[i].c,
          destKey: dsts[i].key,
          color,
        })
      }
      for (let i = n; i < srcs.length; i++) ghosts[srcs[i].key] = { color, r: srcs[i].r, c: srcs[i].c }
      for (let i = n; i < dsts.length; i++) popKeys.add(dsts[i].key)
    }

    const cleanups = []

    if (moves.length > 0) {
      const hidden = new Set(moves.map(m => m.destKey))
      setMovingStars(moves)
      setHiddenCells(hidden)
      const t = setTimeout(() => {
        setMovingStars([])
        setHiddenCells(new Set())
        setArrivedCells(hidden)
        const t2 = setTimeout(() => setArrivedCells(new Set()), 380)
        cleanups.push(() => clearTimeout(t2))
      }, SLIDE_MS)
      cleanups.push(() => clearTimeout(t))
    }

    if (Object.keys(ghosts).length > 0) {
      // Calculer la direction de vol selon la position sur le plateau
      const ejects = Object.entries(ghosts).map(([key, { color, r, c }]) => {
        const cx = PADDING + c * (CELL + GAP) + CELL / 2
        const cy = PADDING + r * (CELL + GAP) + CELL / 2
        const mid = SVG_SIZE / 2
        // Vecteur depuis le centre du plateau → direction de sortie
        const dx = cx - mid
        const dy = cy - mid
        const len = Math.hypot(dx, dy) || 1
        const ex = Math.round((dx / len) * 110)
        const ey = Math.round((dy / len) * 110)
        return { key, color, r, c, ex, ey }
      })
      setEjectStars(ejects)
      const t = setTimeout(() => setEjectStars([]), 600)
      cleanups.push(() => clearTimeout(t))
    }

    if (popKeys.size > 0) {
      setAnimIn(popKeys)
      const t = setTimeout(() => setAnimIn(new Set()), 400)
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
                  hidden={hiddenCells.has(key)}
                  arrived={arrivedCells.has(key)}
                />
              )
            })}
          </div>
        ))}

        {movingStars.map(({ id, fromR, fromC, toR, toC, color }) => {
          const dx     = (toC - fromC) * (CELL + GAP)
          const dy     = (toR - fromR) * (CELL + GAP)
          const fill   = color === 'clair' ? C.clair   : C.fonce
          const stroke = color === 'clair' ? '#fde68a' : '#fca5a5'
          const glow   = color === 'clair' ? C.clairGlow : C.fonceGlow
          return (
            <div
              key={id}
              style={{
                position: 'absolute',
                top:  PADDING + fromR * (CELL + GAP),
                left: PADDING + fromC * (CELL + GAP),
                width: CELL, height: CELL,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
                animation: `starSlide ${SLIDE_MS}ms cubic-bezier(0.35, 0, 0.25, 1) forwards`,
                filter: `drop-shadow(0 0 14px ${glow})`,
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              <EtoileSVG fill={fill} stroke={stroke} strokeWidth={2} innerFill="#fff" />
            </div>
          )
        })}

        {ejectStars.map(({ key, color, r, c, ex, ey }) => {
          const fill   = color === 'clair' ? C.clair   : C.fonce
          const stroke = color === 'clair' ? '#fde68a'  : '#fca5a5'
          const glow   = color === 'clair' ? C.clairGlow : C.fonceGlow
          const ring   = color === 'clair' ? '#fbbf24'  : '#ef4444'
          const top    = PADDING + r * (CELL + GAP)
          const left   = PADDING + c * (CELL + GAP)
          return (
            <div key={key} style={{ position: 'absolute', top, left, width: CELL, height: CELL, pointerEvents: 'none', zIndex: 25 }}>
              {/* Anneau d'impact */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: CELL, height: CELL,
                marginTop: -CELL / 2, marginLeft: -CELL / 2,
                borderRadius: '50%',
                border: `3px solid ${ring}`,
                animation: 'ejectRing 0.5s ease-out forwards',
                opacity: 0.9,
              }} />
              {/* Étoile qui s'envole */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: CELL, height: CELL,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                '--ex': `${ex}px`,
                '--ey': `${ey}px`,
                animation: 'starEject 0.6s cubic-bezier(0.2, 0, 0.8, 1) forwards',
                filter: `drop-shadow(0 0 16px ${glow}) drop-shadow(0 0 6px #fff)`,
              }}>
                <EtoileSVG fill={fill} stroke={stroke} strokeWidth={2} innerFill="#fff" />
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}

function Cellule({ valeur, selectionne, coupValide, phase, onClick, animIn = false, estGagnante = false, hidden = false, arrived = false }) {
  const [survol, setSurvol] = useState(false)
  // Pendant le slide, on cache la pièce destination pour ne pas la doubler
  const valeurEffective = hidden ? null : valeur
  const config = getConfig(valeurEffective, selectionne, coupValide, phase, survol)
  const scale  = selectionne ? 1.18 : survol && config.cursor === 'pointer' ? 1.1 : 1

  const outerFilter = (estGagnante && valeur) ? 'none' : (config.glow ? `drop-shadow(0 0 8px ${config.glow})` : 'none')

  const innerAnim =
    arrived                 ? 'starArrive 0.35s ease-out forwards' :
    animIn                  ? 'starPop 0.35s ease-out forwards' :
    (estGagnante && valeur) ? 'winPulse 1.2s ease-in-out infinite' :
    undefined

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{
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
  )
}

export function EtoileSVG({ fill, stroke, strokeWidth = 1.5, innerFill, size = 54 }) {
  return (
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
  svg:       { position: 'absolute', top: 0, left: 0, pointerEvents: 'none' },
  ligne:     { display: 'flex', gap: GAP },
  invisible: { width: CELL, height: CELL },
}
