import React from 'react';
import { SuburbSubsection } from '../types';
import { getSuburbIcon, formatContent } from '../utils/reportUtils';

interface SuburbProfileSectionProps {
  subsections: SuburbSubsection[];
}

export const SuburbProfileSection: React.FC<SuburbProfileSectionProps> = ({ subsections }) => (
  <div className="space-y-6">
    <div className="text-sm text-slate-500 italic mb-2">
      Demographic and lifestyle analysis of the surrounding neighborhood.
    </div>
    {subsections.map((sub, i) => {
      const SubIcon = getSuburbIcon(sub.title);
      return (
        <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors print:bg-white print:border-slate-200 print:break-inside-avoid">
          <h4 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
             <div className="p-1.5 bg-white rounded-md shadow-sm text-blue-600 print:border print:border-slate-200 print:shadow-none">
               <SubIcon size={16} />
             </div>
             {sub.title}
          </h4>
          <div className="text-slate-700 text-sm leading-relaxed prose prose-slate max-w-none">
            {formatContent(sub.content)}
          </div>
        </div>
      );
    })}
  </div>
);