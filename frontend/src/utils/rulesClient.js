/**
 * rulesClient.js — MOCK temporaire (sera supprimé à N-05)
 * Réplique la logique de backend/game/rules.py pour les tests visuels.
 * Quand le backend sera connecté (N-05), remplacer par les événements Socket.io.
 */

import { NEIGHBORS, estValide, estJouable } from './boardGeometry'

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
