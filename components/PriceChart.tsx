
import { useMemo } from 'react';
import { PricePoint } from '../types';

interface PriceChartProps {
  data: PricePoint[];
  rawContent?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, rawContent }) => {
  // Combine all data and sort chronologically (descending)
  const timelineData = useMemo(() => {
    return [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  if (timelineData.length === 0 && !rawContent) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper for status badge styling based on event and type
  const getBadgeStyles = (point: PricePoint) => {
    const ev = point.event?.toLowerCase() || '';
    const type = point.type;

    if (type === 'rent') {
      if (ev.includes('listed')) return 'bg-sky-100 text-sky-800 border-sky-200';
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else {
      if (ev.includes('listed')) return 'bg-rose-100 text-rose-800 border-rose-200';
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getDotColor = (point: PricePoint) => {
    const ev = point.event?.toLowerCase() || '';
    const type = point.type;
    
    if (type === 'rent') {
      return ev.includes('listed') ? 'bg-sky-500' : 'bg-emerald-600';
    } else {
      return ev.includes('listed') ? 'bg-rose-500' : 'bg-orange-600';
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-10">
        <h3 className="text-xl font-bold text-slate-900">Historical Timeline</h3>
        <p className="text-sm text-slate-500 mt-1">
          Complete chronological records of sales, listings, and rental events.
        </p>
      </div>
      
      {timelineData.length > 0 ? (
        <div className="relative">
          {/* The Vertical Line */}
          <div className="absolute left-[78px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
          
          <div className="space-y-12">
              {timelineData.map((point, i) => {
                const date = new Date(point.date);
                const year = date.getFullYear();
                const isNewYear = i === 0 || new Date(timelineData[i-1].date).getFullYear() !== year;
                const eventText = point.event || (point.type === 'sale' ? 'Sold' : 'Leased');

                return (
                  <div key={i} className="relative flex items-start gap-0 group">
                    {/* Year Indicator */}
                    <div className="w-16 flex-shrink-0 pt-0.5">
                      {isNewYear && (
                        <span className="text-sm font-bold text-slate-600 tracking-tight">
                          {year}
                        </span>
                      )}
                    </div>

                    {/* Node (Circle) */}
                    <div className="relative z-10 w-10 flex flex-col items-center justify-start pt-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white ring-4 ring-white shadow-sm transition-transform group-hover:scale-125 ${
                        point.type === 'sale' ? 'group-hover:border-orange-500' : 'group-hover:border-emerald-500'
                      }`}></div>
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 pl-4">
                      <div className="flex flex-col gap-3">
                        {/* Badge and Price Row */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${getBadgeStyles(point)}`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${getDotColor(point)}`}></span>
                            {eventText}
                          </div>
                          
                          {point.price !== null && (
                            <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                              {point.formattedPrice}
                              {point.type === 'rent' && <span className="text-xs text-slate-400 font-medium ml-1">/ week</span>}
                            </span>
                          )}
                        </div>

                        {/* Description / Meta */}
                        <div className="text-sm text-slate-500 font-medium leading-relaxed flex items-center gap-2">
                          <span>{formatDate(point.date)}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="capitalize">{point.type} Event</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 font-medium italic bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          No historical records found for this property.
        </div>
      )}
    </div>
  );
};
