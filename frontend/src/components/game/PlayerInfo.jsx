import { EtoileSVG } from './Board'
import { useTranslation } from 'react-i18next'
import { palette } from '../../styles/palette'
import { styles, playerCardStyle, tourBadgeStyle, niveauDotStyle, niveauTextStyle } from '../../styles/components/game/PlayerInfo.styles'

export default function PlayerInfo({ joueur, estActif, estMoi = true, niveauIA, compact = false }) {
  const { t }            = useTranslation()
  const { fill, stroke } = palette[joueur.couleur]
  const estIA            = joueur.nom === 'IA'
  const couleurNiveau    = palette.niveauCouleur[niveauIA]
  const labelNiveau      = { facile: t('ia.facile'), moyen: t('ia.moyen'), difficile: t('ia.difficile') }

  if (compact) {
    return (
      <div style={{ ...playerCardStyle(estActif), minWidth: 0, flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {estActif && <div style={{ ...tourBadgeStyle(estMoi), marginBottom: 0, fontSize: 9 }}>{estMoi ? t('game.ton_tour') : t('game.son_tour')}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <EtoileSVG fill={fill} stroke={stroke} strokeWidth={1.5} innerFill="#fff" size={20} />
          <span style={{ ...styles.nom, fontSize: 13 }}>{joueur.nom}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: palette.textMuted }}>
          <span>✋ {joueur.en_main}</span>
          <span>⬡ {joueur.sur_plateau}</span>
        </div>
      </div>
    )
  }

  return (
    <div style={playerCardStyle(estActif)}>

      {estActif && (
        <div style={tourBadgeStyle(estMoi)}>
          {estMoi ? t('game.ton_tour') : t('game.son_tour')}
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

      <Compteur label={t('game.en_main')}     count={joueur.en_main}     fill={fill} stroke={stroke} />
      <Compteur label={t('game.sur_plateau')} count={joueur.sur_plateau} fill={fill} stroke={stroke} />

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
