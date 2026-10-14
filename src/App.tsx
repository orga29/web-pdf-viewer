import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfjsLib, parsePdfOutline } from './pdfConfig';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PdfViewer } from './components/PdfViewer';
import { DropZone } from './components/DropZone';
import type { ViewMode, ZoomPreset, OutlineItem } from './types';
import { AlertCircle, UploadCloud } from 'lucide-react';

export const App: React.FC = () => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset | undefined>(undefined);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF from ArrayBuffer
  const loadPdfData = useCallback(async (data: ArrayBuffer, name: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setFileData(data);
      setFileName(name);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setRotation(0);
      setScale(1.0);
      setZoomPreset(undefined);

      // Fetch outline
      try {
        const rawOutline = await doc.getOutline();
        const parsed = await parsePdfOutline(doc, rawOutline);
        setOutline(parsed);
      } catch (outlineErr) {
        console.warn('Could not load outline:', outlineErr);
        setOutline([]);
      }
    } catch (err: any) {
      console.error('Failed to load PDF:', err);
      setErrorMessage('PDFファイルの読み込みに失敗しました。ファイルが破損しているか、非対応の形式の可能性があります。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle file input
  const handleFileLoaded = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer();
        await loadPdfData(buffer, file.name);
      } catch (e) {
        console.error('Failed to read file:', e);
        setErrorMessage('ファイルの読み取りに失敗しました。');
      }
    },
    [loadPdfData]
  );

  // Open Sample PDF
  const handleOpenSample = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample.pdf`);
      if (!res.ok) throw new Error('Sample PDF not found');
      const buffer = await res.arrayBuffer();
      await loadPdfData(buffer, 'サンプル文書 (sample.pdf)');
    } catch (err) {
      console.error('Error fetching sample PDF:', err);
      setErrorMessage('サンプルPDFの取得に失敗しました。');
      setIsLoading(false);
    }
  }, [loadPdfData]);

  // Drag and drop handlers
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDraggingOver(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setIsDraggingOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          await handleFileLoaded(file);
        } else {
          setErrorMessage('PDF形式のファイル (.pdf) のみをドロップしてください。');
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleFileLoaded]);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (!pdfDoc) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage((prev) => Math.max(prev - 1, 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPage(totalPages);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setRotation((prev) => (prev + 90) % 360);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'w' || e.key === 'W') {
        // 隠しショートカット: Wキーで幅に合わせる
        e.preventDefault();
        setZoomPreset('fit-width');
      } else if (e.key === 'h' || e.key === 'H') {
        // 隠しショートカット: Hキーで高さに合わせる
        e.preventDefault();
        setZoomPreset('fit-height');
      } else if (e.key === 'p' || e.key === 'P') {
        // 隠しショートカット: Pキーで全体を表示
        e.preventDefault();
        setZoomPreset('fit-page');
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomPreset(undefined);
          setScale((prev) => Math.min(4.0, Math.round((prev + 0.15) * 100) / 100));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomPreset(undefined);
          setScale((prev) => Math.max(0.25, Math.round((prev - 0.15) * 100) / 100));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomPreset('fit-page');
        } else if (e.key === '9') {
          e.preventDefault();
          setZoomPreset('fit-width');
        } else if (e.key === '8') {
          e.preventDefault();
          setZoomPreset('fit-height');
        } else if (e.key === '1') {
          e.preventDefault();
          setZoomPreset(undefined);
          setScale(1.0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc, totalPages]);

  // Download PDF
  const handleDownload = () => {
    if (!fileData) return;
    const blob = new Blob([fileData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print PDF
  const handlePrint = () => {
    if (!fileData) return;
    const blob = new Blob([fileData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans"
    >
      {/* Top Toolbar (only shown when PDF is loaded) */}
      {pdfDoc && (
        <Toolbar
          fileName={fileName}
          currentPage={currentPage}
          totalPages={totalPages}
          scale={scale}
          rotation={rotation}
          viewMode={viewMode}
          isSidebarOpen={isSidebarOpen}
          isFullscreen={isFullscreen}
          onPageChange={setCurrentPage}
          onScaleChange={(newScale) => {
            if (typeof newScale === 'string') {
              setZoomPreset(newScale);
            } else {
              setZoomPreset(undefined);
              setScale(newScale);
            }
          }}
          onRotate={() => setRotation((prev) => (prev + 90) % 360)}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleViewMode={() =>
            setViewMode((prev) => (prev === 'single' ? 'continuous' : 'single'))
          }
          onOpenFile={handleFileLoaded}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      )}

      {/* Error notification banner */}
      {errorMessage && (
        <div className="bg-red-900/90 text-red-100 px-4 py-2 text-xs flex items-center justify-between border-b border-red-700 z-30">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="hover:underline ml-4 text-red-200 cursor-pointer font-bold"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
            <p className="text-sm font-medium text-slate-200">PDFを読み込み中...</p>
          </div>
        )}

        {pdfDoc ? (
          <>
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              pdfDoc={pdfDoc}
              totalPages={totalPages}
              currentPage={currentPage}
              outline={outline}
              onPageSelect={(p) => setCurrentPage(p)}
            />
            <PdfViewer
              pdfDoc={pdfDoc}
              currentPage={currentPage}
              totalPages={totalPages}
              scale={scale}
              rotation={rotation}
              viewMode={viewMode}
              onPageChange={setCurrentPage}
              zoomPreset={zoomPreset}
              onScaleCalculated={(s) => setScale(s)}
              onZoomChange={(s) => {
                setZoomPreset(undefined);
                setScale(s);
              }}
            />
          </>
        ) : (
          <DropZone
            onFileLoaded={handleFileLoaded}
            onOpenSample={handleOpenSample}
            isDraggingOver={isDraggingOver}
          />
        )}

        {/* Global drag-over indicator when a PDF is already open */}
        {pdfDoc && isDraggingOver && (
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm z-40 border-4 border-dashed border-indigo-500 flex flex-col items-center justify-center pointer-events-none">
            <div className="p-4 bg-slate-900 rounded-2xl border border-indigo-500 shadow-2xl flex flex-col items-center space-y-2">
              <UploadCloud size={40} className="text-indigo-400 animate-bounce" />
              <p className="text-sm font-semibold text-white">ここにPDFをドロップして開く</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default App;
