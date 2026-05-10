// État initial d'un joueur
export const joueurInitial = (nom, couleur) => ({
  nom,
  couleur,
  en_main:     7,
  sur_plateau: 0,
})

// Niveaux IA disponibles
export const NIVEAUX_IA = ['facile', 'moyen', 'difficile']

// Profondeur minimax par niveau
export const PROFONDEUR_IA = {
  facile:    0,
  moyen:     2,
  difficile: 4,
}
