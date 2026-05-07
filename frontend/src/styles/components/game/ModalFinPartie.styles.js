import { palette } from '../../palette'

export function titreDynStyle(aGagne) {
  return { fontSize: 24, fontWeight: 700, margin: 0, textAlign: 'center', color: aGagne ? palette.violetLight : '#fff' }
}

export function forfaitEmojiStyle() {
  return { ...styles.emoji, background: palette.redBg, border: `2px solid ${palette.redBorder}` }
}

export const styles = {
  overlay:           { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:             { position: 'relative', background: palette.card, borderRadius: 20, padding: '2.5rem 2rem', width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  btnFermer:         { position: 'absolute', top: 12, right: 12, background: palette.cardBorder, border: 'none', borderRadius: 8, color: palette.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' },
  emoji:             { background: palette.bg, borderRadius: '50%', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  etoiles:           { display: 'flex', gap: 8 },
  sous:              { color: palette.textSub, fontSize: 13, textAlign: 'center', margin: 0 },
  badge:             { background: palette.redBgDark, color: '#fca5a5', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, padding: '5px 14px', borderRadius: 99, border: `1px solid ${palette.redBorderDark}`, letterSpacing: 1 },
  dureeBox:          { background: palette.bg, borderRadius: 10, padding: '10px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  dureeLabel:        { color: palette.textMuted, fontSize: 11 },
  dureeVal:          { color: '#fff', fontSize: 22, fontWeight: 700 },
  btnRejouer:        { width: '100%', background: palette.gradientViolet, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnVictoire:       { width: '100%', background: palette.greenSolid, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  barre:             { position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 14, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 100, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' },
  barreGagnant:      { color: palette.violetLight, fontWeight: 700, fontSize: 14 },
  barrePerdu:        { color: palette.textSub, fontWeight: 700, fontSize: 14 },
  btnBarre:          { background: palette.violet, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnBarreSecondaire:{ background: '#374151', color: palette.textSub, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
}
