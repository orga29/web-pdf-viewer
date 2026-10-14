import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface ThumbnailItemProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  isSelected: boolean;
  onClick: () => void;
}

export const ThumbnailItem: React.FC<ThumbnailItemProps> = ({
  pdfDoc,
  pageNumber,
  isSelected,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Lazy render with IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !canvasRef.current || isRendered) return;

    let isCancelled = false;
    let renderTask: any = null;

    const renderThumbnail = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        // Calculate thumbnail scale for ~130px width
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = 130 / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || isCancelled) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Error rendering thumbnail for page ${pageNumber}:`, err);
        }
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [isVisible, pdfDoc, pageNumber, isRendered]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`group flex flex-col items-center cursor-pointer p-2 rounded-lg transition-all ${
        isSelected
          ? 'bg-indigo-600/20 ring-2 ring-indigo-500'
          : 'hover:bg-slate-800/60'
      }`}
    >
      <div className="relative w-32 min-h-40 bg-slate-800 rounded shadow border border-slate-700/60 overflow-hidden flex items-center justify-center">
        {!isRendered && (
          <div className="text-slate-500 text-xs animate-pulse">
            読込中...
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`max-w-full h-auto transition-opacity duration-200 ${
            isRendered ? 'opacity-100' : 'opacity-0 absolute'
          }`}
        />
      </div>
      <span
        className={`mt-1.5 text-xs font-medium ${
          isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
        }`}
      >
        {pageNumber}
      </span>
    </div>
  );
};
