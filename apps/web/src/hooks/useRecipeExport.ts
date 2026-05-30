import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../lib/toast';
import {
  buildExportFilename,
  exportNodeToImage,
  exportNodeToPdf,
} from '../lib/pdf-export';

type ExportTarget = HTMLElement | null;

export type RecipeExportConfig = {
  /** Filename prefix, e.g. "pawcook-cooking". */
  prefix: string;
  /** Filename tail parts, e.g. [meatType, method]. */
  parts?: Array<string | number | undefined | null>;
  /** Footer line printed on every PDF page. */
  footer?: string;
};

export function useRecipeExport() {
  const { t, i18n } = useTranslation();
  const targetRef = useRef<ExportTarget>(null);
  const [busy, setBusy] = useState<null | 'pdf' | 'image'>(null);

  const setTarget = useCallback((node: ExportTarget) => {
    targetRef.current = node;
  }, []);

  const dateLabel = new Date().toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const downloadPdf = useCallback(
    async (cfg: RecipeExportConfig) => {
      const node = targetRef.current;
      if (!node) return;
      setBusy('pdf');
      try {
        await exportNodeToPdf(node, {
          filename: buildExportFilename(cfg.prefix, cfg.parts ?? [], 'pdf'),
          brand: 'PawCook',
          dateLabel,
          footer: cfg.footer ?? t('common.exportFooter'),
        });
        toast.success(t('common.downloadSuccess'));
      } catch (err) {
        console.error(err);
        toast.error(t('common.downloadFailed'));
      } finally {
        setBusy(null);
      }
    },
    [t, dateLabel],
  );

  const downloadImage = useCallback(
    async (cfg: RecipeExportConfig) => {
      const node = targetRef.current;
      if (!node) return;
      setBusy('image');
      try {
        await exportNodeToImage(node, buildExportFilename(cfg.prefix, cfg.parts ?? [], 'png'));
        toast.success(t('common.downloadSuccess'));
      } catch (err) {
        console.error(err);
        toast.error(t('common.downloadFailed'));
      } finally {
        setBusy(null);
      }
    },
    [t],
  );

  return { setTarget, downloadPdf, downloadImage, busy };
}
