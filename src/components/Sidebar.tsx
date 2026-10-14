import React, { useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { LayoutGrid, ListTree, X } from 'lucide-react';
import { ThumbnailItem } from './ThumbnailItem';
import { OutlineTree } from './OutlineTree';
import type { OutlineItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDoc: PDFDocumentProxy | null;
  totalPages: number;
  currentPage: number;
  outline: OutlineItem[];
  onPageSelect: (page: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  pdfDoc,
  totalPages,
  currentPage,
  outline,
  onPageSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'outline'>('thumbnails');

  if (!isOpen) return null;

  return (
    <aside className="w-64 sm:w-72 bg-slate-900 border-r border-slate-700/80 flex flex-col h-full z-10 flex-shrink-0 select-none shadow-xl">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-700/80 px-2 py-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('thumbnails')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'thumbnails'
                ? 'bg-slate-800 text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutGrid size={14} />
            <span>サムネイル</span>
          </button>
          <button
            onClick={() => setActiveTab('outline')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'outline'
                ? 'bg-slate-800 text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ListTree size={14} />
            <span>目次 {outline.length > 0 && `(${outline.length})`}</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          title="サイドバーを閉じる"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'thumbnails' && pdfDoc && (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <ThumbnailItem
                key={`thumb-${pageNum}`}
                pdfDoc={pdfDoc}
                pageNumber={pageNum}
                isSelected={pageNum === currentPage}
                onClick={() => onPageSelect(pageNum)}
              />
            ))}
          </div>
        )}

        {activeTab === 'outline' && (
          <div>
            {outline.length > 0 ? (
              <OutlineTree items={outline} onSelectPage={onPageSelect} />
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                このPDFには目次（アウトライン）が含まれていません
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
