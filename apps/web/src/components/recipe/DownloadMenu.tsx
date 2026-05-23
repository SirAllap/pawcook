import { useTranslation } from 'react-i18next';
import { Download, FileText, Image as ImageIcon, Printer, Loader2 } from 'lucide-react';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from '../ui/dropdown';

type Props = {
  onDownloadPdf: () => void;
  onDownloadImage: () => void;
  onPrint?: () => void;
  busy?: null | 'pdf' | 'image';
  disabled?: boolean;
};

export function DownloadMenu({ onDownloadPdf, onDownloadImage, onPrint, busy, disabled }: Props) {
  const { t } = useTranslation();
  const isBusy = busy !== null && busy !== undefined;

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          disabled={disabled || isBusy}
          aria-label={t('common.download')}
          title={t('common.download')}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 text-sm font-bold text-foreground transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-60 no-print"
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isBusy ? t('common.downloading') : t('common.download')}
          </span>
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownItem onSelect={onDownloadPdf} disabled={isBusy}>
          <FileText className="h-4 w-4" />
          {t('common.downloadPdf')}
        </DropdownItem>
        <DropdownItem onSelect={onDownloadImage} disabled={isBusy}>
          <ImageIcon className="h-4 w-4" />
          {t('common.downloadImage')}
        </DropdownItem>
        {onPrint && (
          <>
            <DropdownSeparator />
            <DropdownItem onSelect={onPrint}>
              <Printer className="h-4 w-4" />
              {t('common.print')}
            </DropdownItem>
          </>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
