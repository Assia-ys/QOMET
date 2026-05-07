import { palette } from '../../palette'
import { CELL, GAP, PADDING } from '../../../constants/board'

export function getCellConfig(valeur, selectionne, coupValide, phase, survol) {
  const b  = palette.board
  const cl = palette.clair
  const fo = palette.fonce
  if (selectionne)        return { fill: b.selection.fill,  stroke: b.selection.stroke, strokeWidth: 2,   glow: b.selection.glow,  innerFill: '#fff', cursor: 'pointer' }
  if (coupValide)         return { fill: survol ? b.coupValideHover : b.coupValide.fill, stroke: b.coupValide.stroke, strokeWidth: 1.5, glow: b.coupValide.glow, innerFill: '#fff', cursor: 'pointer' }
  if (valeur === 'clair') return { fill: survol ? cl.light : cl.fill, stroke: cl.stroke, strokeWidth: 1.5, glow: survol ? cl.glow : cl.glowFaint, innerFill: '#fff', cursor: 'pointer' }
  if (valeur === 'fonce') return { fill: survol ? fo.light : fo.fill, stroke: fo.stroke, strokeWidth: 1.5, glow: survol ? fo.glow : fo.glowFaint, innerFill: '#fff', cursor: 'pointer' }
  if (survol && phase === 'pose') return { fill: b.videHover.fill, stroke: b.videHover.stroke, strokeWidth: 1.5, glow: b.videHover.glow, innerFill: null, cursor: 'pointer' }
  return { fill: b.vide.fill, stroke: b.vide.stroke, strokeWidth: 1, glow: b.vide.glow, innerFill: null, cursor: 'default' }
}

export const styles = {
  wrapper: {
    padding: 6,
    borderRadius: 24,
    background: palette.board.gradient,
    boxShadow: palette.board.wrapperShadow,
  },
  board: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    gap: GAP, padding: PADDING,
    borderRadius: 20,
    border: `1px solid ${palette.board.border}`,
    background: palette.board.innerGradient,
  },
  svg:       { position: 'absolute', top: 0, left: 0, pointerEvents: 'none' },
  ligne:     { display: 'flex', gap: GAP },
  invisible: { width: CELL, height: CELL },
}
