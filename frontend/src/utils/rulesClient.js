/**
 * rulesClient.js — MOCK temporaire (sera supprimé à N-05)
 * Réplique la logique de backend/game/rules.py pour les tests visuels.
 * Quand le backend sera connecté (N-05), remplacer par les événements Socket.io.
 */

import { NEIGHBORS, estValide, estJouable } from './boardGeometry'
import { CASES_JOUABLES } from '../data/mockData'

function estLibre(plateau, r, c) {
  return plateau[r][c] === null
}

/**
 * Retourne les destinations valides pour l'étoile en (row, col).
 * Correspond à slide_moves() du pygame board.py.
 */
export function getCasesAccessibles(plateau, row, col) {
  const resultats = []

  for (const { dest: [nr, nc], dir: [dr, dc] } of (NEIGHBORS[`${row},${col}`] || [])) {
    if (estLibre(plateau, nr, nc)) {
      resultats.push([nr, nc])
    } else {
      const pr = nr + dr, pc = nc + dc
      if (!estValide(pr, pc) || !estJouable(pr, pc)) {
        resultats.push([nr, nc])
      } else if (estLibre(plateau, pr, pc)) {
        resultats.push([nr, nc])
      }
    }
  }

  return resultats
}

/**
 * Détecte si 4 étoiles de même couleur forment un carré sur le plateau.
 * Retourne { couleur, cellules: [[r,c]×4] } ou null.
 */
export function detecterCarreGagnant(plateau) {
  for (let i = 0; i < CASES_JOUABLES.length; i++) {
    for (let j = i + 1; j < CASES_JOUABLES.length; j++) {
      const [r1, c1] = CASES_JOUABLES[i]
      const [r2, c2] = CASES_JOUABLES[j]
      const couleur = plateau[r1][c1]
      if (!couleur || couleur !== plateau[r2][c2]) continue
      const dr = r2 - r1, dc = c2 - c1
      const r3 = r1 + dc, c3 = c1 - dr
      const r4 = r2 + dc, c4 = c2 - dr
      if (!estValide(r3, c3) || !estJouable(r3, c3)) continue
      if (!estValide(r4, c4) || !estJouable(r4, c4)) continue
      if (plateau[r3][c3] !== couleur || plateau[r4][c4] !== couleur) continue
      return { couleur, cellules: [[r1, c1], [r2, c2], [r3, c3], [r4, c4]] }
    }
  }
  return null
}

/**
 * Applique un mouvement de (fromR, fromC) vers (toR, toC).
 * Retourne { nouveauPlateau, etoileEjectee }.
 */
export function appliquerMouvement(plateau, fromR, fromC, toR, toC) {
  const nouveau = plateau.map(row => [...row])
  const pieceActive = plateau[fromR][fromC]
  const pieceDestination = plateau[toR][toC]

  const voisin = (NEIGHBORS[`${fromR},${fromC}`] || [])
    .find(({ dest: [nr, nc] }) => nr === toR && nc === toC)
  const [dr, dc] = voisin ? voisin.dir : [0, 0]

  if (!pieceDestination) {
    nouveau[toR][toC] = pieceActive
    nouveau[fromR][fromC] = null
    return { nouveauPlateau: nouveau, etoileEjectee: null }
  }

  const pr = toR + dr, pc = toC + dc

  if (!estValide(pr, pc) || !estJouable(pr, pc)) {
    nouveau[toR][toC] = pieceActive
    nouveau[fromR][fromC] = null
    return { nouveauPlateau: nouveau, etoileEjectee: pieceDestination }
  }

  nouveau[pr][pc] = pieceDestination
  nouveau[toR][toC] = pieceActive
  nouveau[fromR][fromC] = null
  return { nouveauPlateau: nouveau, etoileEjectee: null }
}
