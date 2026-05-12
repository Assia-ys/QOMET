import { useState, useRef, useEffect, useCallback } from 'react'
import { SET_JOUABLES, EDGES } from '../../utils/boardGeometry'
import { playPlace, playSlide, playPush, playEject } from '../../hooks/useSounds'
import { palette } from '../../styles/palette'
import { CELL, GAP, PADDING, TAILLE, SLIDE_MS, EJECT_MS, SVG_SIZE } from '../../constants/board'
import { styles, getCellConfig } from '../../styles/components/game/Board.styles'

export default function Board({ plateau, selectionne, coupsValides = [], onCellClick, phase = 'pose', cellulesGagnantes = new Set() }) {
  const prevPlateauRef = useRef(plateau)
  const [animIn,       setAnimIn]       = useState(new Set())
  const [movingStars,  setMovingStars]  = useState([])
  const [hiddenCells,  setHiddenCells]  = useState(new Set())
  const [arrivedCells, setArrivedCells] = useState(new Set())
  const [ejectStars,   setEjectStars]   = useState([])

  useEffect(() => {
    const prev = prevPlateauRef.current
    if (prev === plateau) return
    prevPlateauRef.current = plateau

    const disparu = {}
    const apparu  = {}

    for (const key of SET_JOUABLES) {
      const [r, c] = key.split(',').map(Number)
      const prev_  = prev?.[r]?.[c]   ?? null
      const curr   = plateau?.[r]?.[c] ?? null
      if (prev_ === curr) continue
      if (prev_ !== null) (disparu[prev_] ??= []).push({ r, c, key })
      if (curr  !== null) (apparu[curr]   ??= []).push({ r, c, key })
    }

    const moves   = []
    const ghosts  = {}
    const popKeys = new Set()

    for (const color of ['clair', 'fonce']) {
      const srcs = disparu[color] || []
      const dsts = apparu[color]  || []
      const n    = Math.min(srcs.length, dsts.length)
      for (let i = 0; i < n; i++) {
        moves.push({ id: `${srcs[i].key}->${dsts[i].key}`, fromR: srcs[i].r, fromC: srcs[i].c, toR: dsts[i].r, toC: dsts[i].c, destKey: dsts[i].key, color })
      }
      for (let i = n; i < srcs.length; i++) ghosts[srcs[i].key] = { color, r: srcs[i].r, c: srcs[i].c }
      for (let i = n; i < dsts.length; i++) popKeys.add(dsts[i].key)
    }

    if (Object.keys(ghosts).length > 0)                                             playEject()
    else if (moves.length >= 2)                                                      playPush()
    else if (moves.length === 1)                                                     playSlide()
    if (popKeys.size > 0 && moves.length === 0 && Object.keys(ghosts).length === 0) playPlace()

    const cleanups = []

    if (moves.length > 0) {
      const hidden = new Set(moves.map(m => m.destKey))
      setMovingStars(moves)
      setHiddenCells(hidden)
      const t1 = setTimeout(() => {
        setMovingStars([])
        setHiddenCells(new Set())
        setArrivedCells(hidden)
        const t2 = setTimeout(() => setArrivedCells(new Set()), 380)
        cleanups.push(() => clearTimeout(t2))
      }, SLIDE_MS)
      cleanups.push(() => clearTimeout(t1))
    }

    if (Object.keys(ghosts).length > 0) {
      const mid    = SVG_SIZE / 2
      const ejects = Object.entries(ghosts).map(([key, { color, r, c }]) => {
        const cx  = PADDING + c * (CELL + GAP) + CELL / 2
        const cy  = PADDING + r * (CELL + GAP) + CELL / 2
        const dx  = cx - mid
        const dy  = cy - mid
        const len = Math.hypot(dx, dy) || 1
        return { key, color, r, c, ex: Math.round((dx / len) * 110), ey: Math.round((dy / len) * 110) }
      })
      setEjectStars(ejects)
      const t = setTimeout(() => setEjectStars([]), EJECT_MS)
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

  const [scale, setScale] = useState(() => Math.min(1, (window.innerWidth - 32) / SVG_SIZE))
  useEffect(() => {
    const update = () => setScale(Math.min(1, (window.innerWidth - 32) / SVG_SIZE))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const scaledSize = Math.round(SVG_SIZE * scale)

  return (
    <div style={{ width: scaledSize, height: scaledSize, overflow: 'visible', flexShrink: 0 }}>
    <div style={{ transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: 'top left', width: SVG_SIZE, height: SVG_SIZE }}>
    <div style={styles.wrapper}>
      <div style={styles.board}>

        <svg width={SVG_SIZE} height={SVG_SIZE} style={styles.svg}>
          {EDGES.map(([[r1, c1], [r2, c2]], i) => {
            const a    = cellCentre(r1, c1)
            const b    = cellCentre(r2, c2)
            const actif = selectionne &&
              ((selectionne[0] === r1 && selectionne[1] === c1) ||
               (selectionne[0] === r2 && selectionne[1] === c2))
            return (
              <line key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={actif ? palette.board.edgeActive : palette.board.edge}
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
          const p  = palette[color]
          const dx = (toC - fromC) * (CELL + GAP)
          const dy = (toR - fromR) * (CELL + GAP)
          return (
            <div key={id} style={{
              position: 'absolute',
              top:  PADDING + fromR * (CELL + GAP),
              left: PADDING + fromC * (CELL + GAP),
              width: CELL, height: CELL,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              '--dx': `${dx}px`, '--dy': `${dy}px`,
              animation: `starSlide ${SLIDE_MS}ms cubic-bezier(0.35, 0, 0.25, 1) forwards`,
              filter: `drop-shadow(0 0 14px ${p.glow})`,
              pointerEvents: 'none', zIndex: 20,
            }}>
              <EtoileSVG fill={p.fill} stroke={p.stroke} strokeWidth={2} innerFill="#fff" />
            </div>
          )
        })}

        {ejectStars.map(({ key, color, r, c, ex, ey }) => {
          const p    = palette[color]
          const top  = PADDING + r * (CELL + GAP)
          const left = PADDING + c * (CELL + GAP)
          return (
            <div key={key} style={{ position: 'absolute', top, left, width: CELL, height: CELL, pointerEvents: 'none', zIndex: 25 }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: CELL, height: CELL, marginTop: -CELL / 2, marginLeft: -CELL / 2, borderRadius: '50%', border: `3px solid ${p.light}`, animation: 'ejectRing 0.5s ease-out forwards', opacity: 0.9 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: CELL, height: CELL, display: 'flex', alignItems: 'center', justifyContent: 'center', '--ex': `${ex}px`, '--ey': `${ey}px`, animation: `starEject ${EJECT_MS}ms cubic-bezier(0.2, 0, 0.8, 1) forwards`, filter: `drop-shadow(0 0 16px ${p.glow}) drop-shadow(0 0 6px #fff)` }}>
                <EtoileSVG fill={p.fill} stroke={p.stroke} strokeWidth={2} innerFill="#fff" />
              </div>
            </div>
          )
        })}

      </div>
    </div>
    </div>
    </div>
  )
}

function cellCentre(r, c) {
  return { x: PADDING + c * (CELL + GAP) + CELL / 2, y: PADDING + r * (CELL + GAP) + CELL / 2 }
}

function Cellule({ valeur, selectionne, coupValide, phase, onClick, animIn = false, estGagnante = false, hidden = false, arrived = false }) {
  const [survol, setSurvol] = useState(false)
  const config = getCellConfig(hidden ? null : valeur, selectionne, coupValide, phase, survol)
  const scale  = selectionne ? 1.18 : survol && config.cursor === 'pointer' ? 1.1 : 1

  const outerFilter = (estGagnante && valeur) ? 'none' : (config.glow ? `drop-shadow(0 0 8px ${config.glow})` : 'none')
  const innerAnim   =
    arrived                 ? 'starArrive 0.35s ease-out forwards' :
    animIn                  ? 'starPop 0.35s ease-out forwards'    :
    (estGagnante && valeur) ? 'winPulse 1.2s ease-in-out infinite' :
    undefined

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{ width: CELL, height: CELL, cursor: config.cursor, transform: `scale(${scale})`, transition: 'transform 0.15s ease, filter 0.15s ease', filter: outerFilter, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}
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
      <polygon points="26,2 32,19 49,19 36,30 41,47 26,36 11,47 16,30 3,19 20,19" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      {innerFill && <polygon points="26,12 29.5,22 40,22 31.5,28 34.5,39 26,33 17.5,39 20.5,28 12,22 22.5,22" fill={innerFill} opacity="0.25" />}
    </svg>
  )
}
