export const CASES_JOUABLES = [
  [0,0], [0,3], [0,6],
  [1,1], [1,3], [1,5],
  [2,2], [2,3], [2,4],
  [3,0], [3,1], [3,2], [3,3], [3,4], [3,5], [3,6],
  [4,2], [4,3], [4,4],
  [5,1], [5,3], [5,5],
  [6,0], [6,3], [6,6],
]

export const GRILLE_VIDE = Array.from({ length: 7 }, () =>
  Array.from({ length: 7 }, () => null)
)

export const JOUEUR_1_MOCK = { nom: 'Joueur 1', couleur: 'clair', en_main: 7, sur_plateau: 0 }
export const JOUEUR_2_MOCK = { nom: 'Joueur 2', couleur: 'fonce', en_main: 7, sur_plateau: 0 }
