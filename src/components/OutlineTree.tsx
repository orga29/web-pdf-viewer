import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Bookmark } from 'lucide-react';
import type { OutlineItem } from '../types';

interface OutlineTreeProps {
  items: OutlineItem[];
  onSelectPage: (page: number) => void;
  level?: number;
}

export const OutlineTree: React.FC<OutlineTreeProps> = ({
  items,
  onSelectPage,
  level = 0,
}) => {
  return (
    <ul className="space-y-0.5 text-xs">
      {items.map((item, index) => (
        <OutlineNode
          key={`${level}-${index}-${item.title}`}
          item={item}
          onSelectPage={onSelectPage}
          level={level}
        />
      ))}
    </ul>
  );
};

interface OutlineNodeProps {
  item: OutlineItem;
  onSelectPage: (page: number) => void;
  level: number;
}

const OutlineNode: React.FC<OutlineNodeProps> = ({ item, onSelectPage, level }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.items && item.items.length > 0;

  const handleClick = () => {
    if (item.pageNumber) {
      onSelectPage(item.pageNumber);
    }
  };

  return (
    <li>
      <div
        className={`flex items-center py-1.5 px-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer group ${
          level > 0 ? 'ml-3' : ''
        }`}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-0.5 mr-1 text-slate-400 hover:text-slate-200"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <Bookmark size={12} className="mr-2 text-slate-500 group-hover:text-indigo-400 flex-shrink-0" />
        )}

        <span className="truncate flex-1" title={item.title}>
          {item.title}
        </span>

        {item.pageNumber && (
          <span className="text-[10px] text-slate-500 font-mono ml-2 group-hover:text-slate-400">
            P.{item.pageNumber}
          </span>
        )}
      </div>

      {hasChildren && isOpen && item.items && (
        <OutlineTree
          items={item.items}
          onSelectPage={onSelectPage}
          level={level + 1}
        />
      )}
    </li>
  );
};
