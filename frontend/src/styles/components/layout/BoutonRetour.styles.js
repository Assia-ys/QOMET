import { palette } from '../../palette'

export function boutonRetourStyle(survol) {
  return {
    position: 'absolute', top: 24, left: 24,
    background: 'transparent',
    border: `1px solid ${survol ? palette.inputBorder : palette.cardBorder}`,
    borderRadius: 8, padding: '8px 16px',
    color: survol ? palette.textPrimary : palette.textSub,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    display: 'flex', alignItems: 'center', gap: 6,
  }
}
