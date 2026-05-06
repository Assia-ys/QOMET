import { createContext, useContext, useState, useEffect } from 'react'
import fr from '../i18n/fr'
import en from '../i18n/en'

const DICOS = { fr, en }

const LangueContext = createContext(null)

export function LangueProvider({ children }) {
  const [langue, setLangue] = useState(
    () => localStorage.getItem('qomet_langue') || 'fr'
  )

  useEffect(() => {
    localStorage.setItem('qomet_langue', langue)
  }, [langue])

  const t = DICOS[langue] ?? fr

  return (
    <LangueContext.Provider value={{ langue, setLangue, t }}>
      {children}
    </LangueContext.Provider>
  )
}

export function useLangue() {
  return useContext(LangueContext)
}
