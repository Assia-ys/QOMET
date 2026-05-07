import { palette as C } from '../../palette'

export function joueurCardStyle(connected) {
  return {
    background: C.card,
    border: `${connected ? 2 : 1.5}px solid ${connected ? C.green : C.cardBorder}`,
    borderRadius: 16, padding: '16px 20px', textAlign: 'center', width: 120,
  }
}

export function joueurAvatarStyle(connected) {
  return {
    width: 40, height: 40, borderRadius: '50%',
    background: connected ? '#f87171' : '#475569',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
  }
}

export function joueurNomStyle(connected) {
  return { color: connected ? C.textPrimary : C.textSub, fontWeight: 600, fontSize: 13, marginBottom: 2 }
}

export function joueurLabelStyle(connected) {
  return { color: connected ? C.green : C.textMuted, fontSize: 11 }
}

export const styles = {
  page:        { minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  titre:       { fontSize: 26, fontWeight: 800, color: C.textPrimary, marginBottom: 6 },
  sous:        { color: C.textSub, fontSize: 14, marginBottom: 28 },
  codeBox:     { border: `2px dashed ${C.cardBorder}`, borderRadius: 20, padding: '20px 48px', marginBottom: 28, textAlign: 'center' },
  codeLabel:   { color: C.textMuted, fontSize: 12, marginBottom: 10 },
  codeChars:   { display: 'flex', gap: 18 },
  codeChar:    { fontSize: 36, fontWeight: 800, color: C.violetLight, letterSpacing: 2 },
  joueurs:     { display: 'flex', gap: 16, marginBottom: 24 },
  attente:     { color: C.textSub, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 },
  attentePoint:{ width: 8, height: 8, borderRadius: '50%', background: C.textSub, display: 'inline-block' },
  actions:     { display: 'flex', gap: 12 },
  btn:         { background: C.card, color: C.textPrimary, border: `1.5px solid ${C.cardBorder}`, borderRadius: 14, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' },
}
