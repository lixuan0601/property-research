
import React, { useState } from 'react';
import { TrendingUp, Scale, Home, Tag, Calendar, Map as MapIcon, Crosshair, Plus, CheckCircle2, BedDouble, Bath, Car, Maximize, Building, Sun, Battery, Zap, Layout, Layers, Warehouse, Users, Waves } from 'lucide-react';
import { InvestmentMetric, Comparable, PropertyData } from '../types';
import { MultiMarkerMap } from './MultiMarkerMap';
import { formatContent } from '../utils/reportUtils';

interface InvestmentInsightsSectionProps {
  metrics?: InvestmentMetric[];
  comparables?: Comparable[];
  searchAddress?: string;
  hideMap?: boolean;
  subjectCoords?: { lat: number; lng: number };
  content: string;
  onAddToCompare?: (prop: PropertyData) => void;
  comparisonList?: PropertyData[];
}

export const InvestmentInsightsSection: React.FC<InvestmentInsightsSectionProps> = ({ 
  metrics, comparables, searchAddress, hideMap, subjectCoords, content, onAddToCompare, comparisonList = []
}) => {
  const [mapHighlightAddress, setMapHighlightAddress] = useState<string | undefined>(undefined);
  const [resolvedCoords, setResolvedCoords] = useState<{lat: number, lng: number} | null>(subjectCoords || null);

  const handleComparableAdd = (comp: Comparable) => {
    if (!onAddToCompare) return;
    const c = comp as any; 
    const id = btoa(comp.address).substring(0, 16);
    const f = comp.features.toLowerCase();

    const prop: PropertyData = {
      id,
      address: comp.address,
      status: 'SOLD',
      price: comp.soldPrice,
      date: comp.soldDate,
      features: comp.features,
      rawItems: [],
      lat: comp.lat,
      lng: comp.lng,
      type: c.type || 'House',
      beds: c.beds,
      baths: c.baths,
      cars: c.cars,
      landSize: c.landSize,
      pool: f.includes('pool'),
      solar: f.includes('solar'),
      battery: f.includes('battery'),
      tennis: f.includes('tennis'),
      deck: f.includes('deck'),
      balcony: f.includes('balcony'),
      shed: f.includes('shed'),
      grannyFlat: f.includes('granny')
    };
    onAddToCompare(prop);
  };

  return (
    <div className="space-y-12">
      {metrics && metrics.length > 0 && (
        <div className="animate-fade-in">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shadow-sm"><TrendingUp size={14} /></div>
            Suburb Performance Metrics
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid-cols-2">
            {metrics.map((metric, i) => (
              <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${metric.comparison.toLowerCase().includes('above') ? 'bg-green-500' : metric.comparison.toLowerCase().includes('below') ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">{metric.label}</h4>
                <div className="flex items-baseline gap-2 mb-4"><span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metric.value}</span></div>
                <div className="pt-5 mt-auto border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-medium">Suburb Average</span><span className="font-bold text-slate-800">{metric.suburbAverage}</span></div>
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-medium">Relative Performance</span><span className={`font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full border ${metric.comparison.toLowerCase().includes('above') ? 'text-green-600 bg-green-50 border-green-100' : metric.comparison.toLowerCase().includes('below') ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>{metric.comparison}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {comparables && comparables.length > 0 && (
        <div className="pt-10 border-t border-slate-100 animate-fade-in">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shadow-sm"><Scale size={14} /></div>
            Comparable Properties
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
            {comparables.map((comp, i) => {
              const id = btoa(comp.address).substring(0, 16);
              const isAlreadySelected = comparisonList.some(item => item.id === id);
              const c = comp as any;
              const f = comp.features.toLowerCase();
              
              return (
                <div key={i} onMouseEnter={() => setMapHighlightAddress(comp.address)} onMouseLeave={() => setMapHighlightAddress(undefined)} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group relative">
                  <div className="h-2 w-full bg-red-500"></div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 shadow-sm">
                          <Tag size={10} className="mr-1.5" /> SOLD
                        </span>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Calendar size={12} className="text-blue-500" /> {comp.soldDate}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <h4 className="font-black text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">{comp.address}</h4>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-blue-600 uppercase tracking-wider pt-1">
                           <button onClick={() => handleComparableAdd(comp)} disabled={isAlreadySelected} className={`flex items-center gap-1.5 transition-all ${isAlreadySelected ? 'text-green-500' : 'hover:text-blue-800'}`}>
                             {isAlreadySelected ? <CheckCircle2 size={12} /> : <Plus size={12} />} {isAlreadySelected ? 'In Comparison' : 'Add to Compare'}
                           </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-2xl font-black text-blue-600 tracking-tight mb-3">{comp.soldPrice}</div>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                           <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building size={10} /> Type</span>
                             <span className="text-xs font-bold text-slate-700">{c.type || 'House'}</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Maximize size={10} /> Land</span>
                             <span className="text-xs font-bold text-slate-700 truncate">{c.landSize || '-'}</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><BedDouble size={10} /> Beds</span>
                             <span className="text-xs font-bold text-slate-700">{c.beds || '-'}</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Bath size={10} /> Baths</span>
                             <span className="text-xs font-bold text-slate-700">{c.baths || '-'}</span>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                           {f.includes('pool') && <span className="p-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-100" title="Pool"><Waves size={12} /></span>}
                           {f.includes('solar') && <span className="p-1 bg-amber-50 text-amber-600 rounded border border-amber-100" title="Solar"><Sun size={12} /></span>}
                           {f.includes('battery') && <span className="p-1 bg-amber-50 text-amber-600 rounded border border-amber-100" title="Battery"><Battery size={12} /></span>}
                           {f.includes('tennis') && <span className="p-1 bg-purple-50 text-purple-600 rounded border border-purple-100" title="Tennis"><Zap size={12} /></span>}
                           {f.includes('deck') && <span className="p-1 bg-blue-50 text-blue-600 rounded border border-blue-100" title="Deck"><Layout size={12} /></span>}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 italic">"{comp.features}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {searchAddress && !hideMap && (
         <div className="pt-10 border-t border-slate-100 animate-fade-in">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shadow-sm"><MapIcon size={14} /></div> Location Intelligence
            </h4>
            <div className="w-full h-[550px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative mb-6">
              <MultiMarkerMap subjectAddress={searchAddress} subjectCoords={subjectCoords} comparables={comparables?.map(c => ({ address: c.address, label: c.soldPrice, lat: c.lat, lng: c.lng })) || []} highlightAddress={mapHighlightAddress} onSubjectResolved={(coords) => setResolvedCoords(coords)} />
            </div>
         </div>
      )}
    </div>
  );
};
