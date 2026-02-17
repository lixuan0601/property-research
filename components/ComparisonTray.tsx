
import React from 'react';
import { Trash2, X, BedDouble, Bath, Maximize, ChevronRight, Columns } from 'lucide-react';
import { PropertyData } from '../types';

interface ComparisonTrayProps {
  items: PropertyData[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

export const ComparisonTray: React.FC<ComparisonTrayProps> = ({ items, onRemove, onClear, onCompare }) => {
  return (
    <aside className="fixed right-0 top-16 bottom-0 w-80 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-50 animate-slide-in-right">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <Columns size={18} className="text-blue-600" /> Comparison Tray
          </h3>
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
            {items.length}/10 Properties Selected
          </p>
        </div>
        <button onClick={onClear} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="group relative bg-slate-50 border border-slate-100 rounded-xl p-4 hover:bg-white hover:border-blue-200 transition-all">
            <button onClick={() => onRemove(item.id)} className="absolute -top-1.5 -right-1.5 p-1 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 z-10">
              <X size={12} />
            </button>
            <h4 className="text-xs font-black text-slate-800 leading-tight truncate mb-2">{item.address}</h4>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase">
              <div className="flex items-center gap-1"><BedDouble size={10} /> {item.beds || '-'}</div>
              <div className="flex items-center gap-1"><Bath size={10} /> {item.baths || '-'}</div>
              <div className="flex items-center gap-1"><Maximize size={10} /> {item.landSize || '-'}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={onCompare} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          Compare All <ChevronRight size={18} />
        </button>
      </div>
    </aside>
  );
};
