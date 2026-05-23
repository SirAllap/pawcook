import type { jsPDF as JsPdfType } from 'jspdf';

export type ExportOptions = {
  filename: string;
  /** Footer line printed below the captured node. */
  footer?: string;
  /** Brand line printed at the top of the PDF. */
  brand?: string;
  /** Optional ISO date label rendered next to the brand. */
  dateLabel?: string;
};

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 12;
const HEADER_HEIGHT_MM = 14;
const FOOTER_HEIGHT_MM = 10;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - PAGE_MARGIN_MM * 2;

async function captureNode(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas-pro');
  node.classList.add('export-mode');
  await new Promise((r) => requestAnimationFrame(r));
  try {
    return await html2canvas(node, {
      scale: Math.min(2, window.devicePixelRatio || 1.5),
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  } finally {
    node.classList.remove('export-mode');
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

export async function exportNodeToPdf(
  node: HTMLElement,
  { filename, footer, brand = 'PawCook', dateLabel }: ExportOptions,
): Promise<void> {
  const [{ jsPDF }, canvas] = await Promise.all([import('jspdf'), captureNode(node)]);

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pxPerMm = canvas.width / CONTENT_WIDTH_MM;
  const usablePageMm = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2 - HEADER_HEIGHT_MM - FOOTER_HEIGHT_MM;
  const pageSlicePx = Math.floor(usablePageMm * pxPerMm);

  let renderedPx = 0;
  let pageIndex = 0;
  while (renderedPx < canvas.height) {
    if (pageIndex > 0) pdf.addPage();
    drawHeader(pdf, brand, dateLabel);

    const sliceHeightPx = Math.min(pageSlicePx, canvas.height - renderedPx);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0, renderedPx, canvas.width, sliceHeightPx,
      0, 0, canvas.width, sliceHeightPx,
    );

    const sliceHeightMm = sliceHeightPx / pxPerMm;
    pdf.addImage(
      sliceCanvas.toDataURL('image/jpeg', 0.92),
      'JPEG',
      PAGE_MARGIN_MM,
      PAGE_MARGIN_MM + HEADER_HEIGHT_MM,
      CONTENT_WIDTH_MM,
      sliceHeightMm,
      undefined,
      'FAST',
    );

    drawFooter(pdf, footer, pageIndex + 1);
    renderedPx += sliceHeightPx;
    pageIndex += 1;
  }

  triggerDownload(pdf.output('blob'), filename);
}

export async function exportNodeToImage(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await captureNode(node);
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob((b) => res(b), 'image/png', 0.95),
  );
  if (!blob) throw new Error('Image encoding failed');
  triggerDownload(blob, filename);
}

function drawHeader(pdf: JsPdfType, brand: string, dateLabel?: string) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(20, 20, 20);
  pdf.text(brand, PAGE_MARGIN_MM, PAGE_MARGIN_MM + 6);
  if (dateLabel) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(110, 110, 110);
    pdf.text(dateLabel, A4_WIDTH_MM - PAGE_MARGIN_MM, PAGE_MARGIN_MM + 6, { align: 'right' });
  }
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.2);
  pdf.line(PAGE_MARGIN_MM, PAGE_MARGIN_MM + 10, A4_WIDTH_MM - PAGE_MARGIN_MM, PAGE_MARGIN_MM + 10);
}

function drawFooter(pdf: JsPdfType, footer: string | undefined, pageNumber: number) {
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.2);
  pdf.line(
    PAGE_MARGIN_MM,
    A4_HEIGHT_MM - PAGE_MARGIN_MM - FOOTER_HEIGHT_MM + 2,
    A4_WIDTH_MM - PAGE_MARGIN_MM,
    A4_HEIGHT_MM - PAGE_MARGIN_MM - FOOTER_HEIGHT_MM + 2,
  );
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  if (footer) {
    pdf.text(footer, PAGE_MARGIN_MM, A4_HEIGHT_MM - PAGE_MARGIN_MM - 2);
  }
  pdf.text(
    String(pageNumber),
    A4_WIDTH_MM - PAGE_MARGIN_MM,
    A4_HEIGHT_MM - PAGE_MARGIN_MM - 2,
    { align: 'right' },
  );
}

export function buildExportFilename(
  prefix: string,
  parts: Array<string | number | undefined | null>,
  ext: 'pdf' | 'png',
): string {
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const tail = parts.filter(Boolean).map((p) => slug(String(p))).filter(Boolean).join('-');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${slug(prefix)}-${tail ? tail + '-' : ''}${date}.${ext}`;
}
