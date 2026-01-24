
import React, { useState } from 'react';
import { TrendingUp, Scale, Home, Tag, Calendar, Map as MapIcon, Crosshair } from 'lucide-react';
import { InvestmentMetric, Comparable } from '../types';
import { MultiMarkerMap } from './MultiMarkerMap';
import { formatContent } from '../utils/reportUtils';

interface InvestmentInsightsSectionProps {
  metrics?: InvestmentMetric[];
  comparables?: Comparable[];
  searchAddress?: string;
  hideMap?: boolean;
  subjectCoords?: { lat: number; lng: number };
  content: string;
}

export const InvestmentInsightsSection: React.FC<InvestmentInsightsSectionProps> = ({ 
  metrics, comparables, searchAddress, hideMap, subjectCoords, content 
}) => {
  const [mapHighlightAddress, setMapHighlightAddress] = useState<string | undefined>(undefined);
  const [resolvedCoords, setResolvedCoords] = useState<{lat: number, lng: number} | null>(subjectCoords || null);

  return (
    <div className="space-y-12">
      {metrics && metrics.length > 0 && (
        <div className="animate-fade-in">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shadow-sm">
              <TrendingUp size={14} />
            </div>
            Suburb Performance Metrics
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid-cols-2">
            {metrics.map((metric, i) => (
              <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-all print:shadow-none print:break-inside-avoid">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  metric.comparison.toLowerCase().includes('above') ? 'bg-green-500' : 
                  metric.comparison.toLowerCase().includes('below') ? 'bg-orange-500' : 'bg-slate-300'
                }`}></div>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">{metric.label}</h4>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metric.value}</span>
                </div>
                <div className="pt-5 mt-auto border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500 font-medium">Suburb Average</span>
                     <span className="font-bold text-slate-800">{metric.suburbAverage}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500 font-medium">Relative Performance</span>
                     <span className={`font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full border ${
                       metric.comparison.toLowerCase().includes('above') ? 'text-green-600 bg-green-50 border-green-100' : 
                       metric.comparison.toLowerCase().includes('below') ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-slate-600 bg-slate-50 border-slate-200'
                     }`}>{metric.comparison}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {comparables && comparables.length > 0 && (
        <div className="pt-10 border-t border-slate-100 print:break-inside-avoid animate-fade-in">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shadow-sm">
              <Scale size={14} />
            </div>
            Comparable Properties
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            {comparables.map((comp, i) => (
              <div 
                key={i} 
                onMouseEnter={() => setMapHighlightAddress(comp.address)}
                onMouseLeave={() => setMapHighlightAddress(undefined)}
                className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-xl transition-all group cursor-default print:shadow-none print:break-inside-avoid relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 bg-blue-50 rounded-full text-blue-500 border border-blue-100 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Home size={16} />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight max-w-[200px] group-hover:text-blue-700 transition-colors">{comp.address}</h4>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 shadow-sm">
                            <Tag size={10} className="mr-1.5" /> SOLD
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <Calendar size={11} className="text-slate-300" />
                            <span>Sold: {comp.soldDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-xl font-extrabold text-blue-600 tracking-tight">{comp.soldPrice}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest mt-0.5">Sale Price</span>
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      <span className="font-extrabold text-slate-300 uppercase text-[9px] tracking-widest mr-2">Features</span>
                      <span className="text-slate-600 group-hover:text-slate-800 transition-colors">{comp.features}</span>
                    </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {searchAddress && !hideMap && (
         <div className="pt-10 border-t border-slate-100 animate-fade-in print:break-inside-avoid">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shadow-sm">
                <MapIcon size={14} />
              </div>
              Interactive Location Map
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm ring-4 ring-blue-50"></span> 
                  <span>Subject Property</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm ring-4 ring-red-50"></span> 
                  <span>Recent Comparable Sales</span>
                </div>
              </div>
              
              {resolvedCoords && (
                <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-blue-100 shadow-sm">
                  <Crosshair size={16} className="text-blue-500" />
                  <div className="flex flex-col">
                     <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold leading-none mb-1">Subject Geocoordinates</span>
                     <span className="text-xs font-mono font-bold text-blue-600">
                        {resolvedCoords.lat.toFixed(6)}, {resolvedCoords.lng.toFixed(6)}
                     </span>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full h-[550px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-inner relative print:border-slate-300 mb-6">
              <MultiMarkerMap 
                subjectAddress={searchAddress} 
                subjectCoords={subjectCoords}
                comparables={comparables?.map(c => ({ 
                  address: c.address, 
                  label: c.soldPrice,
                  lat: c.lat,
                  lng: c.lng
                })) || []}
                highlightAddress={mapHighlightAddress}
                onSubjectResolved={(coords) => setResolvedCoords(coords)}
              />
            </div>
         </div>
      )}
    </div>
  );
};
