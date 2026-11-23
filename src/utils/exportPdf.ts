import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function exportInvoiceElementToPdf(
  element: HTMLElement,
  fileName: string
): Promise<void> {
  // Ensure fonts and images are ready before snapshot
  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness check failure
    }
  }

  let dataUrl: string;
  try {
    dataUrl = await toPng(element, {
      width: 794,
      height: 1123,
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
  } catch {
    // Fallback if external font stylesheets deny CSS rule inspection
    dataUrl = await toPng(element, {
      width: 794,
      height: 1123,
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      skipFonts: true,
    });
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}
