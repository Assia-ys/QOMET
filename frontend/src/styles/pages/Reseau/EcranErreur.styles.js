import { palette as C } from '../../palette'

export function btnPrimaryStyle(bg = C.violet) {
  return {
    background: bg, color: '#fff', border: 'none',
    borderRadius: 14, padding: '13px', fontWeight: 600, fontSize: 15, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 0.2s', width: '100%',
  }
}

export function btnSecondaryStyle() {
  return {
    background: C.card, color: C.textPrimary, border: `1.5px solid ${C.cardBorder}`,
    borderRadius: 14, padding: '13px', fontWeight: 600, fontSize: 15, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 0.2s', width: '100%',
  }
}

export const styles = {
  page:   { position: 'relative', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 16 },
  icon:   { width: 72, height: 72, borderRadius: '50%', background: C.redBg, border: `2px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  titre:  { fontSize: 24, fontWeight: 800, color: C.textPrimary },
  sous:   { color: C.textSub, fontSize: 14, textAlign: 'center', maxWidth: 280 },
  badge:  { background: C.redBgDark, color: '#fca5a5', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, padding: '5px 14px', borderRadius: 99, border: `1px solid ${C.redBorderDark}`, letterSpacing: 1 },
  actions:{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 8 },
}
