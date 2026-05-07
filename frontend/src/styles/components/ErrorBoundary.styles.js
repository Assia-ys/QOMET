import { palette } from '../palette'

export const styles = {
  page:   { minHeight: '100vh', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:   { background: palette.card, borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, border: `1px solid ${palette.cardBorder}` },
  icon:   { width: 64, height: 64, borderRadius: '50%', background: palette.redBg, border: `2px solid ${palette.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.red, fontSize: 32, fontWeight: 900 },
  titre:  { color: palette.textPrimary, fontSize: 18, fontWeight: 700, textAlign: 'center', margin: 0 },
  message:{ color: palette.red, fontSize: 12, background: palette.bg, padding: '8px 12px', borderRadius: 8, width: '100%', overflow: 'auto', margin: 0 },
  btn:    { background: palette.violet, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
}
