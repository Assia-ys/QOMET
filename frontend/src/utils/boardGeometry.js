/**
 * boardGeometry.js
 * Source unique pour la géométrie du plateau QOMET.
 * Utilisé par Board.jsx (affichage) et Game.jsx (heuristique IA).
 */

import { CASES_JOUABLES } from '../data/mockData'

export const TAILLE = 7

export const SET_JOUABLES = new Set(CASES_JOUABLES.map(([r, c]) => `${r},${c}`))

export function estJouable(r, c) {
  return SET_JOUABLES.has(`${r},${c}`)
}

export function estValide(r, c) {
  return r >= 0 && r < TAILLE && c >= 0 && c < TAILLE
}

// ── Arêtes : horizontal, vertical, 2 diagonales ───────────────────────────────
function buildEdgesAndNeighbors() {
  const edges = []
  const neighbors = {}
  const seen = new Set()

  for (const [r, c] of CASES_JOUABLES) {
    neighbors[`${r},${c}`] = []
  }

  function add(r1, c1, r2, c2) {
    const key = `${Math.min(r1,r2)},${Math.min(c1,c2)}-${Math.max(r1,r2)},${Math.max(c1,c2)}`
    if (seen.has(key)) return
    seen.add(key)
    edges.push([[r1, c1], [r2, c2]])
    const dr = r2 - r1, dc = c2 - c1
    neighbors[`${r1},${c1}`].push({ dest: [r2, c2], dir: [dr, dc] })
    neighbors[`${r2},${c2}`].push({ dest: [r1, c1], dir: [-dr, -dc] })
  }

  // Horizontal
  for (let r = 0; r < TAILLE; r++) {
    const cols = CASES_JOUABLES.filter(([jr]) => jr === r).map(([, c]) => c).sort((a, b) => a - b)
    for (let i = 0; i < cols.length - 1; i++) add(r, cols[i], r, cols[i + 1])
  }

  // Vertical
  for (let c = 0; c < TAILLE; c++) {
    const rows = CASES_JOUABLES.filter(([, jc]) => jc === c).map(([r]) => r).sort((a, b) => a - b)
    for (let i = 0; i < rows.length - 1; i++) add(rows[i], c, rows[i + 1], c)
  }

  // Diagonale ↘ r == c
  const diag1 = CASES_JOUABLES.filter(([r, c]) => r === c).sort(([r1], [r2]) => r1 - r2)
  for (let i = 0; i < diag1.length - 1; i++) add(...diag1[i], ...diag1[i + 1])

  // Diagonale ↙ r + c == 6
  const diag2 = CASES_JOUABLES.filter(([r, c]) => r + c === 6).sort(([r1], [r2]) => r1 - r2)
  for (let i = 0; i < diag2.length - 1; i++) add(...diag2[i], ...diag2[i + 1])

  return { edges, neighbors }
}

export const { EDGES, NEIGHBORS } = (() => {
  const { edges, neighbors } = buildEdgesAndNeighbors()
  return { EDGES: edges, NEIGHBORS: neighbors }
})()
