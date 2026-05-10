import { EtoileSVG } from './Board'
import { useLangue } from '../../hooks/useLangue'
import { palette } from '../../styles/palette'
import { styles, playerCardStyle, tourBadgeStyle, niveauDotStyle, niveauTextStyle } from '../../styles/components/game/PlayerInfo.styles'

export default function PlayerInfo({ joueur, estActif, estMoi = true, niveauIA }) {
  const { t }            = useLangue()
  const { fill, stroke } = palette[joueur.couleur]
  const estIA            = joueur.nom === 'IA'
  const couleurNiveau    = palette.niveauCouleur[niveauIA]
  const labelNiveau      = { facile: t.ia.facile, moyen: t.ia.moyen, difficile: t.ia.difficile }

  return (
    <div style={playerCardStyle(estActif)}>

      {estActif && (
        <div style={tourBadgeStyle(estMoi)}>
          {estMoi ? t.game.ton_tour : t.game.son_tour}
        </div>
      )}

      <div style={styles.joueurRow}>
        <EtoileSVG fill={fill} stroke={stroke} strokeWidth={1.5} innerFill="#fff" size={28} />
        <span style={styles.nom}>{joueur.nom}</span>
        {estIA && niveauIA && (
          <span style={styles.niveauRow}>
            <span style={niveauDotStyle(couleurNiveau)} />
            <span style={niveauTextStyle(couleurNiveau)}>{labelNiveau[niveauIA] ?? niveauIA}</span>
          </span>
        )}
      </div>

      <Compteur label={t.game.en_main}     count={joueur.en_main}     fill={fill} stroke={stroke} />
      <Compteur label={t.game.sur_plateau} count={joueur.sur_plateau} fill={fill} stroke={stroke} />

    </div>
  )
}

function Compteur({ label, count, fill, stroke }) {
  return (
    <div style={styles.compteur}>
      <div style={styles.compteurLabel}>{label}</div>
      <div style={styles.etoilesRow}>
        {Array.from({ length: 7 }, (_, i) => (
          <EtoileSVG
            key={i}
            fill={i < count ? fill : palette.etoileVide.fill}
            stroke={i < count ? stroke : palette.etoileVide.stroke}
            strokeWidth={1}
            innerFill={i < count ? '#fff' : null}
            size={20}
          />
        ))}
      </div>
    </div>
  )
}
