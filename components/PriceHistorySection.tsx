
import React, { useState } from 'react';
import { PricePoint } from '../types';
import { PriceChart } from './PriceChart';
import { Clock, FileText, LayoutList } from 'lucide-react';

interface PriceHistorySectionProps {
  history: PricePoint[];
  content: string;
}

export const PriceHistorySection: React.FC<PriceHistorySectionProps> = ({ history, content }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'text'>('timeline');

  return (
    <div className="flex-1 flex flex-col print:block">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock size={18} className="text-blue-600" /> Historical Analysis
          </h4>
          <p className="text-xs text-slate-500 mt-1 italic">
            Comprehensive tracking of sales and rental events for this address.
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200">
          <button 
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'timeline' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutList size={14} />
            Vertical Timeline
          </button>
          <button 
            onClick={() => setViewMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'text' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={14} />
            Structured Text
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <div className="animate-fade-in">
          <PriceChart data={history} rawContent={content} />
        </div>
      ) : (
        <div className="animate-fade-in space-y-4">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600">
                <FileText size={16} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Raw Price Logs</span>
            </div>
            <div className="space-y-3">
              {history.length > 0 ? (
                history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.type === 'sale' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                      <div>
                        <span className="text-sm font-bold text-slate-800">{item.formattedPrice}</span>
                        <span className="mx-2 text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md border border-slate-100">{item.event}</span>
                      <span className="text-slate-400 font-mono">{item.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-slate-400 text-sm italic">No structured price data detected.</p>
              )}
            </div>
            {content && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Additional Contextual Notes</h5>
                <div className="text-sm text-slate-600 leading-relaxed bg-white/50 p-4 rounded-xl italic">
                  {content.split('\n').filter(l => !l.includes('Date:')).join('\n')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
