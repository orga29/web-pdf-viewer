import React, { useRef } from 'react';
import { UploadCloud, FileText, Sparkles, Command, ArrowLeftRight, ZoomIn, Mouse } from 'lucide-react';

interface DropZoneProps {
  onFileLoaded: (file: File) => void;
  onOpenSample: () => void;
  isDraggingOver: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileLoaded,
  onOpenSample,
  isDraggingOver,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileLoaded(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 select-none">
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileInput}
      />

      <div className="max-w-xl w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <FileText className="w-10 h-10 text-indigo-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            PDF ビューアー
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            高速・軽快に動作するモダンなPDF閲覧アプリです。ファイルをドラッグ＆ドロップするか、ボタンから選択してください。
          </p>
        </div>

        {/* Drop Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 bg-slate-900/60 backdrop-blur-sm ${
            isDraggingOver
              ? 'border-indigo-500 bg-indigo-950/30 scale-[1.02]'
              : 'border-slate-700/80 hover:border-indigo-500/60 hover:bg-slate-800/40'
          }`}
        >
          <div className="p-3 bg-slate-800 rounded-full border border-slate-700 text-indigo-400 shadow">
            <UploadCloud size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              ここにPDFファイルをドラッグ＆ドロップ
            </p>
            <p className="text-xs text-slate-400 mt-1">または クリックしてファイルを選択</p>
          </div>
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md hover:shadow-indigo-500/25 mt-2"
          >
            ファイルを選択
          </button>
        </div>

        {/* Sample button */}
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onOpenSample}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 rounded-lg transition-all cursor-pointer shadow-sm hover:border-indigo-500"
          >
            <Sparkles size={14} className="text-indigo-400" />
            <span>サンプルPDFを試す</span>
          </button>
        </div>

        {/* Feature & Shortcut guide */}
        <div className="pt-6 border-t border-slate-800/80 text-left">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
            <Command size={14} />
            <span>主な機能・キーボード操作</span>
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div className="flex items-center space-x-2 bg-slate-800/40 p-2 rounded border border-slate-800">
              <ArrowLeftRight size={14} className="text-slate-400" />
              <span>左右キー: ページ送り</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/40 p-2 rounded border border-slate-800">
              <Mouse size={14} className="text-indigo-400" />
              <span>ホイール: 順送り・逆送り</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/40 p-2 rounded border border-slate-800">
              <ZoomIn size={14} className="text-slate-400" />
              <span>Ctrl + ホイール / ± : ズーム</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/40 p-2 rounded border border-slate-800">
              <span className="font-mono text-indigo-400 font-bold px-1 bg-slate-900 rounded">R</span>
              <span>時計回りに回転</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
