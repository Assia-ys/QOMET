import { palette as C } from '../../palette'

export function primaryButtonStyle(disabled) {
  return {
    width: '100%', background: disabled ? '#4c4580' : C.violet, color: '#fff', border: 'none',
    borderRadius: 14, padding: '13px', fontWeight: 600, fontSize: 15,
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.7 : 1, transition: 'background 0.2s',
  }
}

export function inputStyle(focus) {
  return {
    width: '100%', background: C.inputBg, border: `1px solid ${focus ? C.inputFocus : C.inputBorder}`,
    borderRadius: 10, padding: '10px 12px', color: C.textPrimary,
    fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  }
}

export function codeInputStyle(focused) {
  return {
    width: 48, height: 52, background: C.bg,
    border: `1.5px solid ${focused ? C.inputFocus : '#2d3748'}`,
    borderRadius: 10, color: C.textPrimary, fontSize: 22, fontWeight: 700,
    textAlign: 'center', outline: 'none', textTransform: 'uppercase', transition: 'border-color 0.15s',
  }
}

export const styles = {
  page:             { minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  titre:            { fontSize: 30, fontWeight: 800, color: C.textPrimary, marginBottom: 6, textAlign: 'center' },
  sous:             { color: C.textSub, fontSize: 14, marginBottom: 40, textAlign: 'center' },
  cardsRow:         { display: 'flex', gap: 24, width: '100%', maxWidth: 720 },
  card:             { flex: 1, background: C.card, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  cardHeader:       { display: 'flex', alignItems: 'center', gap: 12 },
  cardAvatar:       { width: 36, height: 36, borderRadius: '50%', background: C.violetDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', flexShrink: 0 },
  cardSearchAvatar: { width: 36, height: 36, borderRadius: '50%', background: C.violetDark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitre:        { fontWeight: 700, color: C.textPrimary, fontSize: 15 },
  cardSous:         { color: C.textMuted, fontSize: 12 },
  spacer:           { flex: 1 },
  label:            { color: C.textSub, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 },
  codeLabel:        { color: C.textSub, fontSize: 12, textAlign: 'center', marginBottom: 10 },
  codeRow:          { display: 'flex', gap: 10, justifyContent: 'center' },
  footer:           { color: C.textMuted, fontSize: 12, marginTop: 32, display: 'flex', alignItems: 'center', gap: 6 },
}
