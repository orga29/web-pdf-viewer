import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { OutlineItem } from './types';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export { pdfjsLib };

/**
 * PDFのアウトライン（目次）を再帰的にパースし、各項目のページ番号を解決する
 */
export async function parsePdfOutline(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  rawOutline: any[] | null
): Promise<OutlineItem[]> {
  if (!rawOutline || rawOutline.length === 0) return [];

  const resolveItem = async (item: any): Promise<OutlineItem> => {
    let pageNumber: number | undefined;

    try {
      let dest = item.dest;
      if (typeof dest === 'string') {
        dest = await pdfDoc.getDestination(dest);
      }
      if (Array.isArray(dest) && dest.length > 0) {
        const pageRef = dest[0];
        // pageRef can be an explicit page index or a ref object { num, gen }
        if (typeof pageRef === 'number') {
          pageNumber = pageRef + 1;
        } else if (pageRef && typeof pageRef === 'object') {
          const pageIndex = await pdfDoc.getPageIndex(pageRef);
          pageNumber = pageIndex + 1;
        }
      }
    } catch (e) {
      console.warn('Failed to resolve outline page destination:', e);
    }

    let subItems: OutlineItem[] = [];
    if (item.items && item.items.length > 0) {
      subItems = await Promise.all(item.items.map((sub: any) => resolveItem(sub)));
    }

    return {
      title: item.title || '無題の項目',
      pageNumber,
      items: subItems,
      dest: item.dest,
    };
  };

  return Promise.all(rawOutline.map(item => resolveItem(item)));
}
