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
    <div className="space-y-10">
      {metrics && metrics.length > 0 && (
        <div className="animate-fade-in">
          <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" /> Suburb Performance Metrics
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
            {metrics.map((metric, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col relative overflow-hidden print:shadow-none print:break-inside-avoid">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  metric.comparison.toLowerCase().includes('above') ? 'bg-green-500' : 
                  metric.comparison.toLowerCase().includes('below') ? 'bg-orange-500' : 'bg-slate-300'
                }`}></div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{metric.label}</h4>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-slate-900">{metric.value}</span>
                </div>
                <div className="pt-4 mt-auto border-t border-slate-100 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-500">Suburb Average</span>
                     <span className="font-semibold text-slate-700">{metric.suburbAverage}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-500">Relative Performance</span>
                     <span className={`font-bold ${
                       metric.comparison.toLowerCase().includes('above') ? 'text-green-600' : 
                       metric.comparison.toLowerCase().includes('below') ? 'text-orange-600' : 'text-slate-600'
                     }`}>{metric.comparison}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {comparables && comparables.length > 0 && (
        <div className="pt-6 border-t border-slate-100 print:break-inside-avoid animate-fade-in">
          <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Scale size={18} className="text-blue-600" /> Comparable Properties
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
            {comparables.map((comp, i) => (
              <div 
                key={i} 
                onMouseEnter={() => setMapHighlightAddress(comp.address)}
                onMouseLeave={() => setMapHighlightAddress(undefined)}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer active:scale-[0.98] print:shadow-none print:break-inside-avoid relative"
              >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-1 p-1.5 bg-blue-50 rounded-full text-blue-500 print:border print:border-blue-100 flex-shrink-0">
                        <Home size={14} />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-semibold text-slate-800 text-sm leading-tight max-w-[180px] sm:max-w-[200px]">{comp.address}</h4>
                        <div className="mt-1.5 flex">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 shadow-sm">
                            <Tag size={10} className="mr-1" /> SOLD
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md print:border print:border-blue-100">{comp.soldPrice}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">Sale Price</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 pl-9">
                    <Calendar size={12} />
                    <span>Sold: {comp.soldDate}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 pl-1">
                    <p className="text-xs text-slate-600 line-clamp-2">
                      <span className="font-medium text-slate-400 mr-1">Features:</span>
                      {comp.features}
                    </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {searchAddress && !hideMap && (
         <div className="pt-6 border-t border-slate-100 animate-fade-in print:break-inside-avoid">
            <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapIcon size={18} className="text-blue-600" /> Interactive Location Map
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded-full shadow-sm"></span> 
                  <span className="font-medium">Subject Property</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full shadow-sm"></span> 
                  <span className="font-medium">Recent Comparable Sales</span>
                </div>
              </div>
              
              {resolvedCoords && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                  <Crosshair size={14} className="text-blue-500" />
                  <div className="flex flex-col">
                     <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-1">Subject Geocoordinates</span>
                     <span className="text-xs font-mono font-semibold text-blue-600">
                        {resolvedCoords.lat.toFixed(6)}, {resolvedCoords.lng.toFixed(6)}
                     </span>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full h-[550px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-md relative print:border-slate-300 mb-4">
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

      <div className="prose prose-slate prose-sm max-w-none pt-6 border-t border-slate-100">
        {formatContent(content)}
      </div>
    </div>
  );
};