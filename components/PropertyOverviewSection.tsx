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

export const PropertyOverviewSection: React.FC<PropertyOverviewSectionProps> = ({ attrs, content }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
       {attrs.beds && (
         <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
           <BedDouble className="text-blue-500 mb-1" size={20} />
           <span className="font-bold text-slate-800">{attrs.beds}</span>
           <span className="text-[10px] uppercase tracking-wide text-slate-500">Beds</span>
         </div>
       )}
       {attrs.baths && (
         <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
           <Bath className="text-blue-500 mb-1" size={20} />
           <span className="font-bold text-slate-800">{attrs.baths}</span>
           <span className="text-[10px] uppercase tracking-wide text-slate-500">Baths</span>
         </div>
       )}
       {attrs.living && (
         <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
           <Sofa className="text-blue-500 mb-1" size={20} />
           <span className="font-bold text-slate-800">{attrs.living}</span>
           <span className="text-[10px] uppercase tracking-wide text-slate-500">Living</span>
         </div>
       )}
       {attrs.carport && (
         <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
           <Car className="text-blue-500 mb-1" size={20} />
           <span className="font-bold text-slate-800">{attrs.carport}</span>
           <span className="text-[10px] uppercase tracking-wide text-slate-500">Carport</span>
         </div>
       )}
       {attrs.land && (
         <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
           <Maximize className="text-blue-500 mb-1" size={20} />
           <span className="font-bold text-slate-800 text-xs sm:text-sm">{attrs.land}</span>
           <span className="text-[10px] uppercase tracking-wide text-slate-500">Land</span>
         </div>
       )}
       {attrs.buildingSize && (
         <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
           <Ruler className="text-blue-500 mb-1" size={20} />
           <span className="font-bold text-slate-800 text-xs sm:text-sm">{attrs.buildingSize}</span>
           <span className="text-[10px] uppercase tracking-wide text-slate-500">Build Size</span>
         </div>
       )}
       {attrs.buildingCoverage && (
         <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
           <PieChart className="text-blue-500 mb-1" size={20} />
           <span className="font-bold text-slate-800 text-xs sm:text-sm">{attrs.buildingCoverage}</span>
           <span className="text-[10px] uppercase tracking-wide text-slate-500">Coverage</span>
         </div>
       )}
       {attrs.groundElevation && (
         <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
           <Mountain className="text-blue-500 mb-1" size={20} />
           <span className="font-bold text-slate-800 text-xs sm:text-sm">{attrs.groundElevation}</span>
           <span className="text-[10px] uppercase tracking-wide text-slate-500">Elevation</span>
         </div>
       )}
    </div>

    {attrs.type && (
      <div className="flex items-center gap-2 p-3 border border-slate-100 rounded-lg bg-slate-50/50 print:border-slate-200">
         <Home size={16} className="text-slate-400" />
         <span className="text-sm text-slate-500">Property Type:</span>
         <span className="text-sm font-medium text-slate-800">{attrs.type}</span>
      </div>
    )}

    {attrs.features && attrs.features.length > 0 && (
      <div className="print:break-inside-avoid">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Features & Amenities</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print:grid-cols-2">
          {attrs.features.map((feature, i) => {
            const FeatureIcon = getFeatureIcon(feature);
            return (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50 transition-colors print:border print:border-slate-100">
                <FeatureIcon size={16} className="text-blue-500" />
                <span className="text-sm text-slate-700">{feature}</span>
              </div>
            );
          })}
        </div>
      </div>
    )}
    
    <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
       {formatContent(content.split('\n').filter(line => line.includes('Status') || line.includes('Listed')).join('\n'))}
    </div>
  </div>
);