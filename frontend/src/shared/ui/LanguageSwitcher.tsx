import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇹🇳' },
] as const;

export type LangCode = typeof LANGUAGES[number]['code'];

interface LanguageSwitcherProps {
    /** If true, renders as a full select-style card row (for Settings pages).
     *  If false (default), renders as a compact inline dropdown. */
    variant?: 'settings' | 'compact';
}

export function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
    const { i18n, t } = useTranslation();
    const current = i18n.language as LangCode;

    const change = (code: string) => {
        i18n.changeLanguage(code);
        localStorage.setItem('enit_lang', code);
    };

    if (variant === 'settings') {
        return (
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('settings.language.language')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => change(lang.code)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-semibold text-sm transition-all ${current === lang.code
                                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-gray-50'
                                }`}
                        >
                            <span className="text-2xl">{lang.flag}</span>
                            <span>{lang.label}</span>
                            {current === lang.code && (
                                <span className="text-xs font-bold text-primary-600">{t('common.active')}</span>
                            )}
                        </button>
                    ))}
                </div>
                {current === 'ar' && (
                    <p className="mt-3 text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        {t('languageSwitcher.arabicRtlNote')}
                    </p>
                )}
            </div>
        );
    }

    // Compact inline select
    return (
        <select
            value={current}
            onChange={(e) => change(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
            aria-label="Select language"
        >
            {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                </option>
            ))}
        </select>
    );
}

export { LANGUAGES };
