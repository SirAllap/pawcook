import { useState } from 'react';
import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { Sheet } from '../ui/sheet';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '../ui/dropdown';
import { useIsDesktop } from '../../lib/use-media-query';
import { cn } from '../../lib/cn';

export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'pl', label: 'Polski',     flag: '🇵🇱' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const current = LANGUAGES.find((l) => i18n.language.startsWith(l.code)) ?? LANGUAGES[0];

  function selectLang(code: string) {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setOpen(false);
  }

  const triggerContent = (
    <>
      <Languages className="h-4 w-4" aria-hidden />
      <span className="text-base leading-none">{current.flag}</span>
      <span className="hidden sm:inline text-sm font-semibold">{current.label}</span>
    </>
  );

  const triggerCls = cn(
    'inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl',
    'text-foreground hover:bg-surface-2 transition-colors active:scale-95'
  );

  if (isDesktop) {
    return (
      <Dropdown>
        <DropdownTrigger className={triggerCls} aria-label={t('common.changeLanguage', { defaultValue: 'Change language' })}>
          {triggerContent}
        </DropdownTrigger>
        <DropdownContent>
          {LANGUAGES.map((lang) => (
            <DropdownItem
              key={lang.code}
              active={lang.code === current.code}
              onSelect={() => selectLang(lang.code)}
            >
              <span className="text-base">{lang.flag}</span>
              <span className="flex-1">{lang.label}</span>
              {lang.code === current.code && <Check className="h-4 w-4 text-primary" />}
            </DropdownItem>
          ))}
        </DropdownContent>
      </Dropdown>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerCls}
        aria-label={t('common.changeLanguage', { defaultValue: 'Change language' })}
      >
        {triggerContent}
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={t('common.changeLanguage', { defaultValue: 'Choose language' })}>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => {
            const active = lang.code === current.code;
            return (
              <button
                key={lang.code}
                onClick={() => selectLang(lang.code)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold',
                  'transition-all active:scale-95',
                  active
                    ? 'bg-primary text-primary-fg'
                    : 'bg-surface-2 border border-border text-foreground hover:bg-surface-3'
                )}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
