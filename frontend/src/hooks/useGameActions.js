export default function useGameActions(socket) {
  function jouerDeplacement(from, to) {
    socket.emit('jouer', { type: 'deplacement', coup: [from[0], from[1], to[0], to[1]] })
  }

  function jouerPoser(row, col) {
    socket.emit('jouer', { type: 'poser', row, col })
  }

  function jouerEjecter(row, col) {
    socket.emit('jouer', { type: 'ejecter', row, col })
  }

  function demanderCoups(row, col) {
    socket.emit('deplacements_valides', { row, col })
  }

  function abandonner() {
    socket.emit('abandonner')
  }

  function mettreEnPause() {
    socket.emit('pause')
  }

  function reprendre() {
    socket.emit('reprendre')
  }

  return { jouerDeplacement, jouerPoser, jouerEjecter, demanderCoups, abandonner, mettreEnPause, reprendre }
}
