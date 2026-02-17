
import React, { useState } from 'react';
import { ChevronLeft, ArrowLeft, ArrowRight, Scale } from 'lucide-react';
import { PropertyData } from '../types';
import { PropertyCard } from './PropertyCard';

interface ComparisonCarouselProps {
  items: PropertyData[];
  onBack: () => void;
}

export const ComparisonCarousel: React.FC<ComparisonCarouselProps> = ({ items, onBack }) => {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 3;
  const maxIndex = Math.max(0, items.length - visibleCount);
  
  const next = () => setStartIndex(prev => Math.min(prev + 1, maxIndex));
  const prev = () => setStartIndex(prev => Math.max(prev - 1, 0));
  
  const visibleItems = items.slice(startIndex, startIndex + visibleCount);

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md mb-4">
            <ChevronLeft size={16} /> Back to Results
          </button>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200"><Scale size={28} /></div>
            Property Comparison
          </h2>
        </div>
        <div className="flex items-center gap-5 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">
            Viewing {startIndex + 1}—{Math.min(startIndex + visibleCount, items.length)} <span className="text-slate-200 mx-2">/</span> {items.length} Properties
          </span>
          <div className="flex gap-2">
            <button disabled={startIndex === 0} onClick={prev} className="p-3 rounded-2xl border border-slate-200 bg-white shadow-sm disabled:opacity-20 hover:border-blue-500 transition-all">
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <button disabled={startIndex >= maxIndex} onClick={next} className="p-3 rounded-2xl border border-slate-200 bg-white shadow-sm disabled:opacity-20 hover:border-blue-500 transition-all">
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {visibleItems.map((prop) => (
          <PropertyCard key={prop.id} prop={prop} variant="column" />
        ))}
      </div>
    </div>
  );
};
