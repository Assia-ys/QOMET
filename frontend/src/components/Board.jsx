const CASES_JOUABLES = [
  [0,0], [0,3], [0,6],
  [1,1], [1,3], [1,5],
  [2,2], [2,3], [2,4],
  [3,0], [3,1], [3,2], [3,3], [3,4], [3,5], [3,6],
  [4,2], [4,3], [4,4],
  [5,1], [5,3], [5,5],
  [6,0], [6,3], [6,6],
]

const TAILLE = 7

function Cell({ valeur, selectionne, coupValide, onClick }) {
  let background = '#374151'
  let border = '#6b7280'

  if (valeur === "clair")      { background = '#facc15'; border = '#ca8a04' }
  else if (valeur === "fonce") { background = '#991b1b'; border = '#7f1d1d' }
  else if (coupValide)         { background = '#4ade80'; border = '#16a34a' }
  else if (selectionne)        { background = '#60a5fa'; border = '#2563eb' }

  return (
    <div
      onClick={onClick}
      style={{
        width: 48, height: 48,
        borderRadius: '50%',
        border: `2px solid ${border}`,
        background,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    />
  )
}

export default function Board({ grille, selectionne, coupsValides, onCellClick }) {
  const estJouable = (r, c) =>
    CASES_JOUABLES.some(([jr, jc]) => jr === r && jc === c)

  const estCoupValide = (r, c) =>
    coupsValides?.some(([vr, vc]) => vr === r && vc === c)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 32,
      background: '#111827',
      borderRadius: 16,
    }}>
      {Array.from({ length: TAILLE }, (_, r) => (
        <div key={r} style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: TAILLE }, (_, c) => {
            if (!estJouable(r, c)) {
              return <div key={c} style={{ width: 48, height: 48 }} />
            }
            const valeur = grille?.[r]?.[c] ?? null
            const estSel = selectionne?.[0] === r && selectionne?.[1] === c
            return (
              <Cell
                key={c}
                valeur={valeur}
                selectionne={estSel}
                coupValide={estCoupValide(r, c)}
                onClick={() => onCellClick(r, c)}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}