import { palette } from '../palette'

export function tempsRestantStyle(tempsPause) {
  return { color: tempsPause <= 10 ? palette.red : palette.violetLight }
}

export const styles = {
  page: {
    minHeight: '100vh', backgroundColor: palette.bg,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 'clamp(8px, 2vw, 20px)', padding: 'clamp(8px, 2vw, 20px)', position: 'relative',
  },
  bandeau:        { display: 'flex', alignItems: 'center', gap: 16 },
  bandeauTexte:   { color: palette.textSub, fontSize: '0.9rem' },
  chrono:         { color: palette.textDisabled, fontSize: '0.85rem', fontFamily: 'monospace' },
  ejecterBandeau: { display: 'flex', justifyContent: 'center', marginTop: -8 },
  ejecterBtn:     { background: palette.violet, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 },
  iaThink:        { color: palette.violetLight, fontSize: '0.85rem', margin: '-8px 0 0', display: 'flex', alignItems: 'center', gap: 8 },
  iaDot:          { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: palette.violetLight, animation: 'pulse 1s ease-in-out infinite' },
  zoneJeu:        { display: 'flex', alignItems: 'center', gap: 24 },
  actions:        { display: 'flex', gap: 12, marginTop: 8 },
  modaleIcone:    { fontSize: '2rem', color: palette.violetLight, fontWeight: 'bold' },
  modaleTitre:    { color: palette.textPrimary, fontSize: '1.4rem', fontWeight: 'bold' },
  modaleSousTexte:{ color: palette.textSub, textAlign: 'center', lineHeight: 1.6, fontSize: '0.9rem' },
  modaleJoueurs:  { display: 'flex', alignItems: 'center', gap: 24, padding: '12px 24px', backgroundColor: palette.bg, borderRadius: 12, width: '100%', justifyContent: 'center' },
  joueurPauseNom: { color: palette.textPrimary, fontWeight: 'bold' },
  joueurPauseLbl: { color: palette.textMuted, fontSize: '0.8rem' },
  vs:             { color: palette.textMuted, fontWeight: 'bold' },
  abandonIcone:   { fontSize: '2rem' },
  abandonActions: { display: 'flex', gap: 12 },
}
