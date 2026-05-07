import { palette } from '../palette'

export const styles = {
  page: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: palette.bg, color: palette.textPrimary,
  },
  menuContainer:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  titre:           { fontSize: '3rem', fontWeight: 'bold', color: palette.violetLight, letterSpacing: '0.2em', marginBottom: '4px' },
  sousTitre:       { fontSize: '0.9rem', color: palette.textSub, marginBottom: '32px', letterSpacing: '0.1em' },
  boutons:         { display: 'flex', flexDirection: 'column', gap: '12px', width: '280px' },
  spinner: {
    width: '40px', height: '40px',
    border: `4px solid ${palette.cardBorder}`,
    borderTop: `4px solid ${palette.violetLight}`,
    borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '24px 0 16px',
  },
  texteChargement: { color: palette.textSub, fontSize: '1rem', marginBottom: '8px' },
  sousTexte:       { color: '#4ade80', fontSize: '0.85rem' },
}
