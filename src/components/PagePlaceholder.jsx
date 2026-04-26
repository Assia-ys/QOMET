export default function PagePlaceholder({ nom, route }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}>
      <div style={{
        padding: '6px 16px',
        background: '#facc15',
        color: '#0f172a',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        En cours de développement
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9' }}>{nom}</h1>
      <p style={{ color: '#64748b', fontSize: 14 }}>route : {route}</p>
    </div>
  )
}
