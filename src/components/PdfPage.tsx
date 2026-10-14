import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';

interface PdfPageProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
  onPageVisible?: (pageNumber: number) => void;
  marginClass?: string;
}

export const PdfPage: React.FC<PdfPageProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
  onPageVisible,
  marginClass = 'my-0.5',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 800,
  });
  const [isLoading, setIsLoading] = useState(true);

  // IntersectionObserver to report visibility in continuous mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onPageVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            onPageVisible(pageNumber);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onPageVisible]);

  // Render canvas & text layer
  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    const render = async () => {
      try {
        setIsLoading(true);
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const width = Math.floor(viewport.width);
        const height = Math.floor(viewport.height);

        setDimensions({ width, height });

        const canvas = canvasRef.current;
        if (!canvas || isCancelled) return;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform,
        });

        await renderTask.promise;
        if (isCancelled) return;

        // Render TextLayer for text selection and copy
        const textLayerContainer = textLayerRef.current;
        if (textLayerContainer) {
          textLayerContainer.innerHTML = '';
          textLayerContainer.style.width = `${width}px`;
          textLayerContainer.style.height = `${height}px`;
          textLayerContainer.style.setProperty('--total-scale-factor', `${viewport.scale}`);

          try {
            const textContent = await page.getTextContent();
            if (isCancelled) return;

            const textLayer = new TextLayer({
              textContentSource: textContent,
              container: textLayerContainer,
              viewport,
            });

            await textLayer.render();
          } catch (textErr) {
            console.warn(`Text layer render warning on page ${pageNumber}:`, textErr);
          }
        }

        if (!isCancelled) {
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Render error on page ${pageNumber}:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation]);

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNumber}`}
      className={`relative ${marginClass} bg-white shadow-xl rounded-sm transition-all duration-150 mx-auto select-text`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      <canvas
        ref={canvasRef}
        className="block rounded-sm"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      />
      <div
        ref={textLayerRef}
        className="textLayer"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}
    </div>
  );
};
