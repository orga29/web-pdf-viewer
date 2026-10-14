import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  Sidebar,
  Upload,
  Download,
  Printer,
  FileText,
  Rows,
} from 'lucide-react';
import type { ViewMode, ZoomPreset } from '../types';

interface ToolbarProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  viewMode: ViewMode;
  isSidebarOpen: boolean;
  isFullscreen: boolean;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number | ZoomPreset) => void;
  onRotate: () => void;
  onToggleSidebar: () => void;
  onToggleFullscreen: () => void;
  onToggleViewMode: () => void;
  onOpenFile: (file: File) => void;
  onDownload: () => void;
  onPrint: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  fileName,
  currentPage,
  totalPages,
  scale,
  viewMode,
  isSidebarOpen,
  isFullscreen,
  onPageChange,
  onScaleChange,
  onRotate,
  onToggleSidebar,
  onToggleFullscreen,
  onToggleViewMode,
  onOpenFile,
  onDownload,
  onPrint,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      onPageChange(val);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onOpenFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <header className="h-11 bg-slate-900 border-b border-slate-700/80 px-3 flex items-center justify-between text-slate-200 select-none shadow-md z-20">
      {/* Left: Sidebar toggle, File open, File name */}
      <div className="flex items-center space-x-2 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer ${
            isSidebarOpen ? 'bg-slate-800 text-indigo-400' : ''
          }`}
          title={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く (サムネイル・目次)'}
          aria-label="Toggle Sidebar"
        >
          <Sidebar size={16} />
        </button>

        <div className="h-5 w-px bg-slate-700 mx-1" />

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm cursor-pointer"
          title="別のPDFファイルを開く"
        >
          <Upload size={14} />
          <span>開く</span>
        </button>

        <span
          className="text-xs text-slate-300 font-medium truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px] ml-2"
          title={fileName}
        >
          {fileName}
        </span>
      </div>

      {/* Center: Page Navigation & Zoom Controls */}
      <div className="flex items-center space-x-2">
        {/* Page navigation */}
        <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 shadow-inner">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="前のページ (←)"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center px-2 space-x-1 text-xs">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handlePageInput}
              className="w-10 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
            />
            <span className="text-slate-400">/</span>
            <span className="text-slate-400 font-mono">{totalPages}</span>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="次のページ (→)"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60">
          <button
            onClick={() => onScaleChange(Math.max(0.25, Math.round((scale - 0.15) * 100) / 100))}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="縮小 (Ctrl -)"
          >
            <ZoomOut size={16} />
          </button>

          <select
            value={Math.round(scale * 100)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'fit-width' || val === 'fit-height' || val === 'fit-page') {
                onScaleChange(val);
              } else {
                onScaleChange(parseInt(val, 10) / 100);
              }
            }}
            className="bg-transparent text-xs text-slate-200 px-1.5 py-1 focus:outline-none cursor-pointer"
          >
            <option value="50" className="bg-slate-800 text-slate-200">50%</option>
            <option value="75" className="bg-slate-800 text-slate-200">75%</option>
            <option value="100" className="bg-slate-800 text-slate-200">100%</option>
            <option value="125" className="bg-slate-800 text-slate-200">125%</option>
            <option value="150" className="bg-slate-800 text-slate-200">150%</option>
            <option value="200" className="bg-slate-800 text-slate-200">200%</option>
            <option value="fit-width" className="bg-slate-800 text-slate-200">幅に合わせる</option>
            <option value="fit-height" className="bg-slate-800 text-slate-200">高さに合わせる</option>
            <option value="fit-page" className="bg-slate-800 text-slate-200">全体を表示</option>
          </select>

          <button
            onClick={() => onScaleChange(Math.min(4.0, Math.round((scale + 0.15) * 100) / 100))}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="拡大 (Ctrl +)"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Right: Display mode, Rotate, Print/Download, Fullscreen */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onToggleViewMode}
          className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer ${
            viewMode === 'continuous' ? 'bg-slate-800 text-indigo-400' : ''
          }`}
          title={viewMode === 'single' ? '連続スクロール表示に切替' : '単一ページ表示に切替'}
        >
          {viewMode === 'single' ? <FileText size={16} /> : <Rows size={16} />}
        </button>

        <button
          onClick={onRotate}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="時計回りに90度回転 (R)"
        >
          <RotateCw size={16} />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5 hidden sm:block" />

        <button
          onClick={onPrint}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer hidden sm:block"
          title="印刷"
        >
          <Printer size={16} />
        </button>

        <button
          onClick={onDownload}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer hidden sm:block"
          title="ダウンロード"
        >
          <Download size={16} />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={isFullscreen ? '全画面解除 (F / Esc)' : '全画面表示 (F)'}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>
    </header>
  );
};
