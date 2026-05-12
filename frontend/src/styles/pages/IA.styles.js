import { palette } from '../palette'

export function carteNiveauStyle(selectionne, bordure) {
  return {
    background: palette.card, borderRadius: 16, padding: '2rem', width: 220,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    textAlign: 'center', transition: 'border .2s', position: 'relative', cursor: 'pointer',
    border: `2px solid ${selectionne ? bordure : palette.cardBorder}`,
  }
}

export function cocheStyle(bordure) {
  return {
    position: 'absolute', top: -12, right: -12, width: 28, height: 28,
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, background: bordure,
  }
}

export function badgeNiveauStyle(bordure) {
  return { borderRadius: 999, padding: '2px 12px', fontSize: 12, fontWeight: 600, background: bordure + '33', color: bordure }
}

export function boutonCommencerStyle(actif) {
  return { ...styles.bouton, opacity: actif ? 1 : 0.5, cursor: actif ? 'pointer' : 'not-allowed' }
}

export const styles = {
  page:     { position: 'relative', minHeight: '100vh', background: palette.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 4vw, 32px)', color: '#fff' },
  titre:    { fontSize: 36, fontWeight: 700, marginBottom: 4 },
  sous:     { color: palette.textSub, marginBottom: 40 },
  grille:   { display: 'flex', gap: 24, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' },
  iconeRow: { marginBottom: 8, display: 'flex' },
  nom:      { color: '#fff', fontSize: 18 },
  desc:     { color: palette.textSub, fontSize: 13, marginTop: 4 },
  champ:    { display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 400, marginBottom: 16 },
  label:    { color: palette.textSub, fontSize: 14 },
  input:    { background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 15, outline: 'none', width: '100%' },
  bouton:   { background: palette.violetFaded, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 16, fontWeight: 600, width: '100%', maxWidth: 400 },
}
