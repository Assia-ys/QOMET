/**
 * Moteur audio synthétisé — Web Audio API uniquement, aucun fichier externe.
 * Chaque son est généré par oscillateurs + enveloppes + bruit.
 */

let _ctx    = null
let _master = null
let _volume = Number(localStorage.getItem('qomet_volume') ?? 65) / 100

// ── Contexte audio ─────────────────────────────────────────────────────────

function ctx() {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx    = new (window.AudioContext || window.webkitAudioContext)()
    _master = _ctx.createGain()
    _master.connect(_ctx.destination)
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  _master.gain.value = _volume
  return _ctx
}

// Débloque l'AudioContext sur mobile (iOS exige un geste utilisateur)
function _unlock() {
  if (!_ctx) {
    _ctx    = new (window.AudioContext || window.webkitAudioContext)()
    _master = _ctx.createGain()
    _master.connect(_ctx.destination)
    _master.gain.value = _volume
  }
  if (_ctx.state === 'suspended') _ctx.resume()
}
document.addEventListener('touchstart', _unlock, { once: true })
document.addEventListener('click',      _unlock, { once: true })

export function setEffectsVolume(pct) {
  _volume = Math.max(0, Math.min(1, pct / 100))
  if (_master) _master.gain.value = _volume
  localStorage.setItem('qomet_volume', pct)
}

function out() { return _master }

// ── Helpers ────────────────────────────────────────────────────────────────

function osc(c, type, freq, start, stop, gainStart, gainEnd) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(gainStart, start)
  g.gain.exponentialRampToValueAtTime(Math.max(gainEnd, 0.0001), stop)
  o.connect(g); g.connect(out())
  o.start(start); o.stop(stop)
}

function sweep(c, type, freqFrom, freqTo, start, stop, gainStart, gainEnd) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freqFrom, start)
  o.frequency.exponentialRampToValueAtTime(freqTo, stop)
  g.gain.setValueAtTime(gainStart, start)
  g.gain.exponentialRampToValueAtTime(Math.max(gainEnd, 0.0001), stop)
  o.connect(g); g.connect(out())
  o.start(start); o.stop(stop)
}

function noise(c, start, dur, gain) {
  const sr  = c.sampleRate
  const buf = c.createBuffer(1, sr * dur, sr)
  const d   = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  const g   = c.createGain()
  src.buffer = buf
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  src.connect(g); g.connect(out())
  src.start(start); src.stop(start + dur)
}

// ── Sons ───────────────────────────────────────────────────────────────────

/** Pose d'une étoile : clic net et satisfaisant */
export function playPlace() {
  try {
    const c = ctx(), t = c.currentTime
    sweep(c, 'triangle', 1100, 500, t, t + 0.09, 0.55, 0.001)
    sweep(c, 'sine',      200, 100, t, t + 0.07, 0.20, 0.001)
  } catch (_) {}
}

/** Glissement d'une pièce : whoosh doux */
export function playSlide() {
  try {
    const c = ctx(), t = c.currentTime
    sweep(c, 'sine', 260, 680, t,        t + 0.18, 0.01, 0.22)
    sweep(c, 'sine', 680, 480, t + 0.18, t + 0.30, 0.22, 0.001)
  } catch (_) {}
}

/** Poussée : impact lourd + projection */
export function playPush() {
  try {
    const c = ctx(), t = c.currentTime
    sweep(c, 'sawtooth', 180, 50,  t,        t + 0.20, 0.50, 0.001)
    noise(c, t, 0.07, 0.30)
    sweep(c, 'sine',     350, 780, t + 0.06, t + 0.30, 0.01, 0.18)
    sweep(c, 'sine',     780, 520, t + 0.30, t + 0.40, 0.18, 0.001)
  } catch (_) {}
}

/** Éjection : envol dramatique hors du plateau */
export function playEject() {
  try {
    const c = ctx(), t = c.currentTime
    noise(c, t, 0.08, 0.45)
    sweep(c, 'sawtooth', 950, 90,  t,        t + 0.50, 0.55, 0.001)
    sweep(c, 'square',  1400, 120, t + 0.02, t + 0.45, 0.12, 0.001)
  } catch (_) {}
}

/** Victoire : fanfare montante + accord final */
export function playWin() {
  try {
    const c = ctx(), t = c.currentTime
    const arp = [523, 659, 784, 1047]
    arp.forEach((f, i) => {
      const s = t + i * 0.13
      osc(c, 'triangle', f,     s, s + 0.22, 0.42, 0.001)
      osc(c, 'sine',     f / 2, s, s + 0.18, 0.15, 0.001)
    })
    const cs = t + arp.length * 0.13 + 0.02
    ;[523, 659, 784, 1047].forEach(f => {
      osc(c, 'sine',     f,     cs, cs + 0.7, 0.18, 0.001)
      osc(c, 'triangle', f * 2, cs, cs + 0.4, 0.08, 0.001)
    })
  } catch (_) {}
}

/** Défaite : descente chromatique mélancolique */
export function playLose() {
  try {
    const c = ctx(), t = c.currentTime
    const notes = [494, 440, 392, 330]
    notes.forEach((f, i) => {
      const s = t + i * 0.21
      osc(c, 'sine',     f,     s, s + 0.30, 0.30, 0.001)
      osc(c, 'triangle', f * 2, s, s + 0.18, 0.08, 0.001)
    })
  } catch (_) {}
}

// ── Hook ───────────────────────────────────────────────────────────────────

export default function useSounds() {
  return { playPlace, playSlide, playPush, playEject, playWin, playLose }
}
