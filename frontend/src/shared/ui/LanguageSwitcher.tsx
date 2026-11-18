import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
] as const;

export type LangCode = typeof LANGUAGES[number]['code'];

interface LanguageSwitcherProps {
    /** If true, renders as a full select-style card row (for Settings pages).
     *  If false (default), renders as a compact inline dropdown. */
    variant?: 'settings' | 'compact';
    className?: string;
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
    const { i18n, t } = useTranslation();
    const current = i18n.language as LangCode;

    const change = (code: string) => {
        i18n.changeLanguage(code);
        localStorage.setItem('enit_lang', code);
    };

    if (variant === 'settings') {
        return (
            <div>
                <p id="language-label" className="block text-sm font-medium text-ink mb-2">
                    {t('settings.language.language')}
                </p>
                <div role="radiogroup" aria-labelledby="language-label" className="inline-flex rounded-md border border-neutral-300 bg-surface p-0.5">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            type="button"
                            role="radio"
                            aria-checked={current === lang.code}
                            lang={lang.code}
                            onClick={() => change(lang.code)}
                            className={`px-4 py-1.5 rounded text-sm font-medium ${current === lang.code
                                    ? 'bg-ink text-white'
                                    : 'text-body hover:bg-canvas hover:text-ink'
                                }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
                {current === 'ar' && (
                    <p className="mt-2 text-sm text-muted-foreground">
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
            className={cn('h-8 text-sm border border-neutral-300 rounded-md ps-2 pe-7 bg-surface text-ink hover:border-neutral-400 cursor-pointer', className)}
            aria-label={t('settings.language.language')}
        >
            {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.label}
                </option>
            ))}
        </select>
    );
}

export { LANGUAGES };
