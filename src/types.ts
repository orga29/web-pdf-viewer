import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface OutlineItem {
  title: string;
  pageNumber?: number;
  items?: OutlineItem[];
  dest?: any;
}

export type ViewMode = 'single' | 'continuous';

export type ZoomPreset = 'fit-width' | 'fit-height' | 'fit-page' | number;

export interface DocumentInfo {
  name: string;
  size?: number;
  numPages: number;
  pdfDoc: PDFDocumentProxy;
}
