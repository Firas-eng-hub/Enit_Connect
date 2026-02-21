import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en';
import fr from './locales/fr';
import ar from './locales/ar';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            fr: { translation: fr },
            ar: { translation: ar },
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr', 'ar'],
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'enit_lang',
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false,
        },
    });

// Set <html dir> and <html lang> on load and whenever language changes
function applyHtmlAttributes(lng: string) {
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
}

applyHtmlAttributes(i18n.language);
i18n.on('languageChanged', applyHtmlAttributes);

export default i18n;
