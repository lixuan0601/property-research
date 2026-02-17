
import React from 'react';
import { Home, BedDouble, Bath, Car, Maximize, Building, Calendar, Waves, Sun, Battery, Zap, Layout, Layers, Warehouse, Users, ExternalLink, Map as MapIcon, Plus, CheckCircle2 } from 'lucide-react';
import { PropertyData } from '../types';
import { getStatusColor } from '../utils/propertyUtils';

interface PropertyCardProps {
  prop: PropertyData;
  variant?: 'list' | 'column';
  onShowOnMap?: (address: string) => void;
  onAddToCompare?: (prop: PropertyData) => void;
  isAlreadySelected?: boolean;
}

export const FeaturesBadges = ({ prop }: { prop: PropertyData }) => (
  <div className="flex flex-wrap gap-2">
    {prop.pool && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100"><Waves size={12} /> Pool</span>}
    {prop.solar && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-100"><Sun size={12} /> Solar</span>}
    {prop.battery && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-100"><Battery size={12} /> Battery</span>}
    {prop.tennis && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase rounded-lg border border-purple-100"><Zap size={12} /> Tennis</span>}
    {prop.deck && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100"><Layout size={12} /> Deck</span>}
    {prop.balcony && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100"><Layers size={12} /> Balcony</span>}
    {prop.shed && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100"><Warehouse size={12} /> Shed</span>}
    {prop.grannyFlat && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100"><Users size={12} /> Granny Flat</span>}
  </div>
);

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
  prop, 
  variant = 'list', 
  onShowOnMap, 
  onAddToCompare, 
  isAlreadySelected 
}) => {
  const colors = getStatusColor(prop.status);
  const domainProfile = prop.domainUrl || `https://www.google.com/search?q=site:domain.com.au+${encodeURIComponent(prop.address)}`;

  if (variant === 'column') {
    return (
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative group/card">
        <div className={`h-2.5 w-full ${colors.dot}`}></div>
        <div className="p-8 flex-1 flex flex-col">
          <div className="mb-8">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-4 shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`}></span>{prop.status}
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover/card:text-blue-600 transition-colors min-h-[3rem]">{prop.address}</h3>
            <div className="text-3xl font-black text-blue-600 tracking-tight">{prop.price || 'Price on request'}</div>
          </div>
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building size={10} /> Type</span>
                 <span className="text-sm font-bold text-slate-700">{prop.type || '-'}</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><BedDouble size={10} /> Beds</span>
                 <span className="text-sm font-bold text-slate-700">{prop.beds || '-'}</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Bath size={10} /> Baths</span>
                 <span className="text-sm font-bold text-slate-700">{prop.baths || '-'}</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Car size={10} /> Cars</span>
                 <span className="text-sm font-bold text-slate-700">{prop.cars || '-'}</span>
               </div>
               <div className="flex flex-col gap-1 col-span-2">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Maximize size={10} /> Land Size</span>
                 <span className="text-sm font-bold text-slate-700">{prop.landSize || '-'}</span>
               </div>
            </div>
            <div className="py-4 space-y-3">
              <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Premium Features</h4>
              <FeaturesBadges prop={prop} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group relative">
      <div className={`h-2 w-full ${colors.dot}`}></div>
      <div className="p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`}></span>{prop.status}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Building size={14} className="text-blue-500" /> {prop.type}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Calendar size={14} className="text-blue-500" /> {prop.date}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <a href={domainProfile} target="_blank" rel="noopener noreferrer" className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight leading-tight">
                {prop.address}
              </a>
              <div className="flex items-center gap-4 text-xs font-bold text-blue-600 uppercase tracking-wider pt-1">
                 {onShowOnMap && <button onClick={() => onShowOnMap(prop.address)} className="flex items-center gap-1.5 hover:text-blue-800"><MapIcon size={14} /> Show on Map</button>}
                 {onAddToCompare && (
                    <button onClick={() => onAddToCompare(prop)} disabled={isAlreadySelected} className={`flex items-center gap-1.5 ${isAlreadySelected ? 'text-green-500' : 'hover:text-blue-800'}`}>
                      {isAlreadySelected ? <CheckCircle2 size={14} /> : <Plus size={14} />} {isAlreadySelected ? 'In Comparison' : 'Add to Comparison'}
                    </button>
                 )}
              </div>
            </div>

            {prop.description && (
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl bg-slate-50 p-4 rounded-2xl border border-slate-100 border-l-4 border-l-blue-500 italic">
                "{prop.description}"
              </p>
            )}
            
            <div className="pt-2">
              <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Premium Features</h4>
              <FeaturesBadges prop={prop} />
            </div>
          </div>

          <div className="lg:w-72 flex flex-col gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
              <div className="text-3xl font-black text-blue-600 tracking-tighter mb-4">{prop.price || 'Request Price'}</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><BedDouble size={10} /> Beds</span>
                  <span className="text-sm font-bold text-slate-700">{prop.beds || '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Bath size={10} /> Baths</span>
                  <span className="text-sm font-bold text-slate-700">{prop.baths || '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Car size={10} /> Cars</span>
                  <span className="text-sm font-bold text-slate-700">{prop.cars || '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Maximize size={10} /> Land</span>
                  <span className="text-sm font-bold text-slate-700 truncate">{prop.landSize || '-'}</span>
                </div>
              </div>
            </div>
            <a href={domainProfile} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 font-bold hover:border-blue-500 hover:text-blue-600 hover:shadow-lg transition-all active:scale-95">
              View on Domain <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
