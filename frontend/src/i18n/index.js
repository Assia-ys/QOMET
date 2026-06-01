import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './fr.json'
import en from './en.json'

const LANG_KEY = 'qomet_lang_v2'

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng:         localStorage.getItem(LANG_KEY) || 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

// Ne sauvegarder qu'après l'init — pas pendant le chargement initial
let initialized = false
i18n.on('initialized', () => { initialized = true })
i18n.on('languageChanged', (lng) => {
  if (initialized) localStorage.setItem(LANG_KEY, lng)
})

export default i18n
