export const palette = {
  // ── Fonds ─────────────────────────────────────────────────────────────
  bg:            '#0f172a',
  card:          '#1e293b',
  cardDark:      '#111827',
  cardBorder:    '#334155',
  inputBg:       '#0f172a',
  inputBorder:   '#475569',
  inputFocus:    '#7c3aed',

  // ── Violet (couleur primaire) ──────────────────────────────────────────
  violet:        '#7c3aed',
  violetHover:   '#6d28d9',
  violetLight:   '#a78bfa',
  violetDark:    '#312e81',
  violetFaded:   '#6366f1',

  // ── Statuts ────────────────────────────────────────────────────────────
  green:         '#22c55e',
  greenSolid:    '#16a34a',
  red:           '#ef4444',
  redBg:         'rgba(127,29,29,0.4)',
  redBgDark:     'rgba(127,29,29,0.5)',
  redBorder:     '#991b1b',
  redBorderDark: '#7f1d1d',
  yellow:        '#eab308',
  orange:        '#f97316',

  // ── Textes ─────────────────────────────────────────────────────────────
  textPrimary:   '#f1f5f9',
  textSub:       '#94a3b8',
  textMuted:     '#64748b',
  textDisabled:  '#475569',

  // ── Gradients ──────────────────────────────────────────────────────────
  gradientViolet: 'linear-gradient(90deg, #6366f1, #8b5cf6)',

  // ── Étoiles joueurs ─────────────────────────────────────────────────────
  clair: {
    fill:      '#f59e0b',
    stroke:    '#fde68a',
    light:     '#fbbf24',
    glow:      'rgba(245,158,11,0.5)',
    glowFaint: 'rgba(245,158,11,0.25)',
  },
  fonce: {
    fill:      '#dc2626',
    stroke:    '#fca5a5',
    light:     '#ef4444',
    glow:      'rgba(220,38,38,0.5)',
    glowFaint: 'rgba(220,38,38,0.25)',
  },
  etoileVide: { fill: '#1f2937', stroke: '#374151' },

  // ── IA niveaux ─────────────────────────────────────────────────────────
  niveauFacile:    '#22c55e',
  niveauMoyen:     '#eab308',
  niveauDifficile: '#ef4444',
  niveauCouleur: {
    facile:    '#22c55e',
    moyen:     '#eab308',
    difficile: '#ef4444',
  },

  // ── Plateau (Board) ────────────────────────────────────────────────────
  board: {
    vide:            { fill: '#1e1b4b', stroke: '#6d28d9', glow: 'rgba(124,58,237,0.2)' },
    videHover:       { fill: '#2d1f5e', stroke: '#7c3aed', glow: 'rgba(124,58,237,0.4)' },
    selection:       { fill: '#a78bfa', stroke: '#c4b5fd', glow: 'rgba(167,139,250,0.6)' },
    coupValide:      { fill: '#34d399', stroke: '#a7f3d0', glow: 'rgba(52,211,153,0.5)' },
    coupValideHover: '#6ee7b7',
    edge:            '#6d28d9',
    edgeActive:      '#a78bfa',
    gradient:        'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 50%, #0f172a 100%)',
    innerGradient:   'radial-gradient(ellipse at center, #1e1320ff 0%, #180a1eff 100%)',
    border:          'rgba(124,58,237,0.3)',
    wrapperShadow:   '0 0 40px rgba(124,58,237,0.3), 0 25px 60px rgba(0,0,0,0.6)',
  },
}
