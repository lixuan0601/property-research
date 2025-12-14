import React, { useEffect, useState } from 'react';
import { SectionProgress } from '../types';
import { CheckCircle2, CircleDashed, XCircle, Clock } from 'lucide-react';

interface AnalysisProgressProps {
  progress: Record<string, SectionProgress>;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress }) => {
  const [now, setNow] = useState(Date.now());

  // Update timer every 100ms if there are pending items
  useEffect(() => {
    // Explicitly cast Object.values result to SectionProgress[] to fix TS "unknown" error
    const hasPending = (Object.values(progress) as SectionProgress[]).some(p => p.status === 'pending');
    if (!hasPending) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [progress]);

  // Define a fixed order for display stability
  const order = ['overview', 'investment', 'history', 'suburb', 'schools'];
  const items = order.map(key => progress[key]).filter(Boolean);
  
  if (items.length === 0) return null;

  const total = items.length;
  const completed = items.filter(i => i.status === 'completed' || i.status === 'error').length;
  const percent = Math.round((completed / total) * 100);

  return (
    <div className="w-full max-w-xl mx-auto mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in transition-all">
       <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <Clock size={16} className="text-blue-600" />
             <span className="text-sm font-semibold text-slate-700">Real-time Analysis</span>
          </div>
          <span className="text-xs font-medium text-slate-500">{percent}% Complete</span>
       </div>
       
       {/* Global Progress Bar */}
       <div className="w-full h-1 bg-slate-100">
         <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
         ></div>
       </div>

       <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((item) => {
             const isPending = item.status === 'pending';
             const isError = item.status === 'error';
             
             // Calculate duration
             const start = item.startTime;
             const end = item.endTime || now;
             const duration = ((end - start) / 1000).toFixed(1);

             return (
               <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                  <div className="flex items-center gap-2.5">
                     {isPending && <CircleDashed size={16} className="text-blue-500 animate-spin" />}
                     {!isPending && !isError && <CheckCircle2 size={16} className="text-green-500" />}
                     {isError && <XCircle size={16} className="text-red-500" />}
                     <span className={`text-sm ${isPending ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                       {item.label}
                     </span>
                  </div>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isPending ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-700 font-medium'}`}>
                     {duration}s
                  </span>
               </div>
             );
          })}
       </div>
    </div>
  )
}