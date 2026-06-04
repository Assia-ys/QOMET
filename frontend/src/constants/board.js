// Les 25 cases jouables du plateau 7x7
export const CASES_JOUABLES = [
  [0,0], [0,3], [0,6],
  [1,1], [1,3], [1,5],
  [2,2], [2,3], [2,4],
  [3,0], [3,1], [3,2], [3,3], [3,4], [3,5], [3,6],
  [4,2], [4,3], [4,4],
  [5,1], [5,3], [5,5],
  [6,0], [6,3], [6,6],
]

// Grille vide 7x7 
export const GRILLE_VIDE = () =>
  Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => null))

// Géométrie du plateau 
export const CELL     = 54   // taille d'une cellule en px
export const GAP      = 14   // espace entre cellules en px
export const PADDING  = 36   // marge interne du plateau en px
export const TAILLE   = 7    // nombre de rangées / colonnes
export const SLIDE_MS = 340  // durée animation déplacement (ms)
export const EJECT_MS = 600  // durée animation éjection (ms)
export const SVG_SIZE = PADDING * 2 + TAILLE * CELL + (TAILLE - 1) * GAP