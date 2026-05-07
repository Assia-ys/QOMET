import { Component } from 'react'
import { styles } from '../styles/components/ErrorBoundary.styles'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>!</div>
          <h1 style={styles.titre}>Une erreur inattendue s'est produite</h1>
          <pre style={styles.message}>{this.state.error.message}</pre>
          <button style={styles.btn} onClick={() => window.location.reload()}>
            Recharger l'application
          </button>
        </div>
      </div>
    )
  }
}
