import { palette } from '../palette'

export function toggleStyle(actif) {
  return {
    width: 44, height: 24, borderRadius: 999, display: 'flex', alignItems: 'center',
    padding: '0 3px', cursor: 'pointer', transition: 'background .2s',
    background: actif ? palette.violetFaded : palette.cardBorder,
    justifyContent: actif ? 'flex-end' : 'flex-start',
  }
}

export function boutonLangueStyle(actif) {
  return {
    background: actif ? palette.violetFaded : palette.card,
    color:  actif ? '#fff' : palette.textSub,
    border: `1.5px solid ${actif ? palette.violetFaded : palette.cardBorder}`,
    borderRadius: 8, padding: '7px 16px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
  }
}

export const styles = {
  page:         { minHeight: '100vh', background: palette.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '70px 16px 20px', color: '#fff', position: 'relative' },
  titre:        { fontSize: 32, fontWeight: 700, marginBottom: 4 },
  sous:         { color: palette.textSub, marginBottom: 32 },
  section:      { background: palette.card, borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 560, marginBottom: 16 },
  sectionTitre: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 16, fontWeight: 600 },
  rangee:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  champLabel:   { color: '#cbd5e1', fontSize: 14 },
  hint:         { color: palette.textDisabled, fontSize: 12, margin: '4px 0 0' },
  inputPetit:   { background: palette.bg, border: `1px solid ${palette.cardBorder}`, borderRadius: 6, padding: '6px 10px', color: '#fff', width: 80, fontSize: 13 },
  slider:       { width: '100%', marginTop: 8, accentColor: palette.violetFaded },
  langueOptions:{ display: 'flex', gap: 8 },
  toggleBall:   { width: 18, height: 18, borderRadius: '50%', background: '#fff' },
  boutons:      { display: 'flex', gap: 12, width: '100%', maxWidth: 560, marginTop: 8 },
  btnSave:      { flex: 1, background: palette.gradientViolet, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  btnAnnuler:   { background: palette.cardBorder, color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  sliderRow:    { marginBottom: 16 },
  sliderHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sliderValeur: { color: palette.textSub, fontSize: 13 },
}
