import { palette } from '../../palette'

export function playerCardStyle(estActif) {
  return {
    padding: 20, borderRadius: 12, minWidth: 140, maxWidth: 200, transition: 'all 0.3s',
    background: estActif ? palette.card : palette.cardDark,
    border: `2px solid ${estActif ? palette.violet : palette.cardDark}`,
  }
}

export function tourBadgeStyle(estMoi) {
  return {
    background: estMoi ? palette.violet : '#374151', color: 'white',
    fontSize: 11, fontWeight: 'bold', padding: '3px 10px', borderRadius: 20,
    display: 'inline-block', marginBottom: 10, letterSpacing: 1,
  }
}

export function niveauDotStyle(couleur) {
  return { width: 8, height: 8, borderRadius: '50%', background: couleur ?? palette.textSub, display: 'inline-block', flexShrink: 0 }
}

export function niveauTextStyle(couleur) {
  return { color: couleur ?? palette.textSub, fontSize: 11, fontWeight: 600 }
}

export const styles = {
  joueurRow:    { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  nom:          { color: 'white', fontWeight: 'bold', fontSize: 16 },
  niveauRow:    { display: 'flex', alignItems: 'center', gap: 5 },
  compteur:     { marginBottom: 12 },
  compteurLabel:{ color: palette.textMuted, fontSize: 12, marginBottom: 6 },
  etoilesRow:   { display: 'flex', gap: 4, flexWrap: 'wrap' },
}
