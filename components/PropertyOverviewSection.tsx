
import React from 'react';
import { 
  BedDouble, Bath, Sofa, Maximize, Car, Ruler, PieChart, Mountain, Home
} from 'lucide-react';
import { PropertyAttributes } from '../types';
import { formatContent, getFeatureIcon } from '../utils/reportUtils';

interface PropertyOverviewSectionProps {
  attrs: PropertyAttributes;
  content: string;
}

export const PropertyOverviewSection: React.FC<PropertyOverviewSectionProps> = ({ attrs, content }) => {
  return (
    <div className="space-y-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
         {attrs.beds && (
           <div className="flex flex-col items-center justify-center p-5 bg-blue-50/50 rounded-2xl text-center print:border print:border-blue-100 hover:bg-blue-100/30 transition-colors border border-blue-100/50">
             <BedDouble className="text-blue-600 mb-1.5" size={24} />
             <span className="font-bold text-slate-800 text-xl">{attrs.beds}</span>
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Bedrooms</span>
           </div>
         )}
         {attrs.baths && (
           <div className="flex flex-col items-center justify-center p-5 bg-blue-50/50 rounded-2xl text-center print:border print:border-blue-100 hover:bg-blue-100/30 transition-colors border border-blue-100/50">
             <Bath className="text-blue-600 mb-1.5" size={24} />
             <span className="font-bold text-slate-800 text-xl">{attrs.baths}</span>
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Bathrooms</span>
           </div>
         )}
         {attrs.living && (
           <div className="flex flex-col items-center justify-center p-5 bg-blue-50/50 rounded-2xl text-center print:border print:border-blue-100 hover:bg-blue-100/30 transition-colors border border-blue-100/50">
             <Sofa className="text-blue-600 mb-1.5" size={24} />
             <span className="font-bold text-slate-800 text-xl">{attrs.living}</span>
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Living</span>
           </div>
         )}
         {attrs.carport && (
           <div className="flex flex-col items-center justify-center p-5 bg-blue-50/50 rounded-2xl text-center print:border print:border-blue-100 hover:bg-blue-100/30 transition-colors border border-blue-100/50">
             <Car className="text-blue-600 mb-1.5" size={24} />
             <span className="font-bold text-slate-800 text-xl">{attrs.carport}</span>
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Parking</span>
           </div>
         )}
      </div>

      {/* Secondary Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
         {attrs.land && (
           <div className="flex flex-col p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
             <Maximize className="text-slate-400 mb-2" size={18} />
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Land Size</span>
             <span className="font-bold text-slate-800">{attrs.land}</span>
           </div>
         )}
         {attrs.buildingSize && (
           <div className="flex flex-col p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
             <Ruler className="text-slate-400 mb-2" size={18} />
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Build Area</span>
             <span className="font-bold text-slate-800">{attrs.buildingSize}</span>
           </div>
         )}
         {attrs.buildingCoverage && (
           <div className="flex flex-col p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
             <PieChart className="text-slate-400 mb-2" size={18} />
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Coverage</span>
             <span className="font-bold text-slate-800">{attrs.buildingCoverage}</span>
           </div>
         )}
         {attrs.groundElevation && (
           <div className="flex flex-col p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
             <Mountain className="text-slate-400 mb-2" size={18} />
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Elevation</span>
             <span className="font-bold text-slate-800">{attrs.groundElevation}</span>
           </div>
         )}
      </div>

      {attrs.type && (
        <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl bg-white shadow-sm print:border-slate-200">
           <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
             <Home size={20} />
           </div>
           <div>
             <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block leading-none mb-1.5">Property Configuration</span>
             <span className="text-lg font-bold text-slate-800">{attrs.type}</span>
           </div>
        </div>
      )}

      {attrs.features && attrs.features.length > 0 && (
        <div className="print:break-inside-avoid pt-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-slate-200"></span>
            Features & Quality
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2">
            {attrs.features.map((feature, i) => {
              const FeatureIcon = getFeatureIcon(feature);
              return (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-blue-200 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                    <FeatureIcon size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{feature}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Listing Metadata */}
      <div className="mt-8 pt-6 border-t border-slate-100">
         <div className="flex flex-wrap gap-x-12 gap-y-6">
           {content.split('\n').map((line, i) => {
             if (line.includes('Status') || line.includes('Listed')) {
               const parts = line.split(':');
               const label = parts[0]?.trim();
               const value = parts[1]?.trim();
               if (!label || !value) return null;
               return (
                 <div key={i} className="flex flex-col min-w-[120px]">
                   <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                     <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                     {label}
                   </span>
                   <span className="font-bold text-slate-800 text-sm">
                     {value}
                   </span>
                 </div>
               );
             }
             return null;
           })}
         </div>
      </div>
    </div>
  );
};