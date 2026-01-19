import React from 'react';
import { MapPin, Award } from 'lucide-react';
import { School } from '../types';

interface SchoolCatchmentSectionProps {
  schools: School[];
}

export const SchoolCatchmentSection: React.FC<SchoolCatchmentSectionProps> = ({ schools }) => (
  <div className="space-y-4">
    <p className="text-sm text-slate-500 italic mb-2">Nearby public and private educational institutions.</p>
    {schools.map((school, i) => (
      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all gap-3 print:border-slate-200 print:bg-white print:break-inside-avoid">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800">{school.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide border ${
              school.type.toLowerCase().includes('private') 
                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {school.type}
            </span>
          </div>
          {school.distance && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={12} />
              <span>{school.distance}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-slate-100 shadow-sm self-start sm:self-center print:shadow-none print:border-slate-200">
          <Award size={14} className="text-amber-500" />
          <span className="text-sm font-bold text-slate-700">{school.rating}</span>
        </div>
      </div>
    ))}
  </div>
);