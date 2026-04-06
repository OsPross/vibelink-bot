import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pl from '../locales/pl.json';
import en from '../locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pl: { translation: pl },
      en: { translation: en }
    },
    lng: 'pl', // Domyślny język
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // Wyłącza uciążliwe kodowanie znaków
    }
  });

export default i18n;