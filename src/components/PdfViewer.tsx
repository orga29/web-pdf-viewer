import React, { useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfPage } from './PdfPage';
import type { ViewMode, ZoomPreset } from '../types';

interface PdfViewerProps {
  pdfDoc: PDFDocumentProxy;
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  viewMode: ViewMode;
  onPageChange: (page: number) => void;
  onScaleCalculated?: (scale: number) => void;
  onZoomChange?: (scale: number) => void;
  zoomPreset?: ZoomPreset;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfDoc,
  currentPage,
  totalPages,
  scale,
  rotation,
  viewMode,
  onPageChange,
  onScaleCalculated,
  onZoomChange,
  zoomPreset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle fit-width, fit-height and fit-page auto scaling
  useEffect(() => {
    if (!zoomPreset || typeof zoomPreset === 'number') return;
    const container = containerRef.current;
    if (!container) return;

    let isCancelled = false;

    const calculateFitScale = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const unscaledViewport = page.getViewport({ scale: 1, rotation });
        const containerWidth = Math.max(10, container.clientWidth - 8);
        const containerHeight = Math.max(10, container.clientHeight - 4); // Minimal top/bottom margin

        if (zoomPreset === 'fit-width') {
          const newScale = Math.max(0.2, containerWidth / unscaledViewport.width);
          onScaleCalculated?.(Math.round(newScale * 100) / 100);
        } else if (zoomPreset === 'fit-height') {
          const newScale = Math.max(0.2, containerHeight / unscaledViewport.height);
          onScaleCalculated?.(Math.round(newScale * 100) / 100);
        } else if (zoomPreset === 'fit-page') {
          const widthScale = containerWidth / unscaledViewport.width;
          const heightScale = containerHeight / unscaledViewport.height;
          const newScale = Math.max(0.2, Math.min(widthScale, heightScale));
          onScaleCalculated?.(Math.round(newScale * 100) / 100);
        }
      } catch (e) {
        console.error('Failed to calculate fit scale:', e);
      }
    };

    calculateFitScale();

    const handleResize = () => {
      calculateFitScale();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
    };
  }, [pdfDoc, currentPage, rotation, zoomPreset, onScaleCalculated]);

  // Scroll to page in continuous mode when currentPage changes externally (e.g. from thumbnail or toolbar)
  useEffect(() => {
    if (viewMode === 'continuous') {
      const pageEl = document.getElementById(`pdf-page-${currentPage}`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentPage, viewMode]);

  // Mouse wheel navigation & zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastWheelTime = 0;
    const cooldownMs = 280;

    const handleWheel = (e: WheelEvent) => {
      // Ctrl + Wheel: Zoom In / Out
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY;
        if (delta < 0) {
          onZoomChange?.(Math.min(4.0, Math.round((scale + 0.15) * 100) / 100));
        } else {
          onZoomChange?.(Math.max(0.25, Math.round((scale - 0.15) * 100) / 100));
        }
        return;
      }

      // Single page mode: Wheel turns pages (scroll forward / backward)
      if (viewMode === 'single') {
        const isScrollable = container.scrollHeight > container.clientHeight + 6;
        const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 6;
        const atTop = container.scrollTop <= 6;

        // If page fits container OR user scrolled to top/bottom edge
        if (!isScrollable || (e.deltaY > 0 && atBottom) || (e.deltaY < 0 && atTop)) {
          const now = Date.now();
          if (now - lastWheelTime < cooldownMs) {
            e.preventDefault();
            return;
          }

          if (e.deltaY > 20) {
            // Scroll down -> Next page (順送り)
            if (currentPage < totalPages) {
              e.preventDefault();
              lastWheelTime = now;
              onPageChange(currentPage + 1);
              // Reset container scroll to top for the new page
              setTimeout(() => {
                if (container) container.scrollTop = 0;
              }, 30);
            }
          } else if (e.deltaY < -20) {
            // Scroll up -> Previous page (逆送り)
            if (currentPage > 1) {
              e.preventDefault();
              lastWheelTime = now;
              onPageChange(currentPage - 1);
              // Reset container scroll to bottom for the previous page if scrollable
              setTimeout(() => {
                if (container) container.scrollTop = container.scrollHeight;
              }, 30);
            }
          }
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [viewMode, currentPage, totalPages, scale, onPageChange, onZoomChange]);

  return (
    <main
      ref={containerRef}
      className="flex-1 bg-slate-950/80 overflow-auto p-0.5 sm:px-1 flex flex-col items-center justify-start min-h-0 relative select-text"
      tabIndex={0}
    >
      {viewMode === 'single' ? (
        <div className="flex items-center justify-center min-h-full w-full">
          <PdfPage
            pdfDoc={pdfDoc}
            pageNumber={currentPage}
            scale={scale}
            rotation={rotation}
            marginClass="my-0"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center w-full py-1 space-y-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <PdfPage
              key={`page-${pageNumber}`}
              pdfDoc={pdfDoc}
              pageNumber={pageNumber}
              scale={scale}
              rotation={rotation}
              marginClass="my-0.5"
              onPageVisible={(visiblePage) => {
                if (visiblePage !== currentPage) {
                  onPageChange(visiblePage);
                }
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
};
