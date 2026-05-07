import { SERVER_URL } from '../config/config'

const TIMEOUT_MS = 5000

function withTimeout(promise, ms = TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return promise(controller.signal).finally(() => clearTimeout(timer))
}

export async function creerPartie(prenom) {
  return withTimeout(signal =>
    fetch(`${SERVER_URL}/parties`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prenom }),
      signal,
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
  )
}

export async function verifierPartie(code) {
  return withTimeout(signal =>
    fetch(`${SERVER_URL}/parties/${code}`, { signal }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
  )
}
