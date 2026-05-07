import { styles } from '../../styles/components/ui/Modal.styles'

export default function Modal({ children }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.carte}>{children}</div>
    </div>
  )
}
