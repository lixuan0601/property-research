
import React, { useMemo, useState } from 'react';
import { PricePoint } from '../types';
import { List, TrendingUp, Calendar, DollarSign, FileText } from 'lucide-react';

interface PriceChartProps {
  data: PricePoint[];
  rawContent?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, rawContent }) => {
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  
  // Split data into sales and rent
  const { salesData, rentData } = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return {
      salesData: sorted.filter(d => d.type === 'sale'),
      rentData: sorted.filter(d => d.type === 'rent')
    };
  }, [data]);

  // View state
  const [metric, setMetric] = useState<'sale' | 'rent'>(salesData.length > 0 ? 'sale' : 'rent');
  const [view, setView] = useState<'chart' | 'list'>('chart');

  // Determine which data to show
  const activeData = metric === 'sale' ? salesData : rentData;
  // Chart data must have valid numeric prices
  const chartData = useMemo(() => activeData.filter(d => d.price !== null) as (PricePoint & { price: number })[], [activeData]);

  if (activeData.length === 0 && (salesData.length === 0 && rentData.length === 0) && !rawContent) {
    return null;
  }

  // --- Chart Drawing Logic ---
  const width = 600;
  const height = 220;
  const padding = { top: 30, right: 30, bottom: 30, left: 70 };

  const prices = chartData.map(d => d.price);
  const dates = chartData.map(d => new Date(d.date).getTime());

  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);

  const getX = (date: number) => {
    if (minDate === maxDate) return width / 2;
    return padding.left + ((date - minDate) / (maxDate - minDate)) * (width - padding.left - padding.right);
  };

  const getY = (price: number) => {
    if (minPrice === maxPrice) return height / 2;
    return height - padding.bottom - ((price - minPrice) / (maxPrice - minPrice)) * (height - padding.top - padding.bottom);
  };

  const pathD = chartData.reduce((acc, point, i) => {
    const x = getX(new Date(point.date).getTime());
    const y = getY(point.price);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = chartData.length > 1 
    ? `${pathD} L ${getX(maxDate)} ${height - padding.bottom} L ${getX(minDate)} ${height - padding.bottom} Z`
    : '';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  const handleMetricChange = (newMetric: 'sale' | 'rent') => {
    if (newMetric === 'sale' && salesData.length === 0) return;
    if (newMetric === 'rent' && rentData.length === 0) return;
    setMetric(newMetric);
    setHoveredPoint(null);
  };

  return (
    <div className="mt-2 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header / Controls */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
        
        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
          <button
            onClick={() => handleMetricChange('sale')}
            disabled={salesData.length === 0}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              metric === 'sale'
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            Sales History
          </button>
          <button
            onClick={() => handleMetricChange('rent')}
            disabled={rentData.length === 0}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              metric === 'rent'
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            Rental History
          </button>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
          <button
            onClick={() => setView('chart')}
            className={`p-2 rounded-lg transition-all ${
              view === 'chart' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Chart View"
          >
            <TrendingUp size={18} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-all ${
              view === 'list' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Vertical Timeline"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {view === 'chart' && chartData.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <TrendingUp size={28} className="mb-3 opacity-30" />
            <span className="font-medium tracking-tight">Insufficient numeric data to plot chart.</span>
            {activeData.length > 0 && <span className="text-[10px] mt-2 text-slate-500 uppercase font-bold tracking-widest">Switch to Timeline view for event logs</span>}
          </div>
        )}

        {view === 'chart' && chartData.length > 0 && (
          <div className="relative w-full animate-fade-in">
             <div className="mb-6 flex items-center justify-between h-8">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} />
                Market Trajectory
              </h4>
              {hoveredPoint && (
                <div className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full shadow-sm border border-blue-100 flex items-center gap-3 animate-slide-in">
                  <span>{hoveredPoint.formattedPrice}</span>
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span>
                  <span className="font-medium text-slate-500">{formatDate(hoveredPoint.date)}</span>
                </div>
              )}
            </div>

            {chartData.length === 1 ? (
               <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="text-4xl font-black text-slate-800 tracking-tighter">{chartData[0].formattedPrice}</div>
                  <div className="text-xs text-slate-500 mt-3 flex items-center gap-3 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold uppercase tracking-wider">{chartData[0].event || 'Recorded'}</span>
                    <span className="font-semibold">{formatDate(chartData[0].date)}</span>
                  </div>
               </div>
            ) : (
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: '35%' }}>
                <div className="absolute inset-0">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                      const y = height - padding.bottom - tick * (height - padding.top - padding.bottom);
                      const price = minPrice + tick * (maxPrice - minPrice);
                      return (
                        <g key={tick}>
                          <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                          <text x={padding.left - 15} y={y + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#cbd5e1">
                            {formatCurrency(price)}
                          </text>
                        </g>
                      );
                    })}

                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#chartGradient)" className="transition-all duration-700 ease-in-out" />

                    <path
                      d={pathD}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-700 ease-in-out"
                    />

                    {chartData.map((point, i) => {
                      const x = getX(new Date(point.date).getTime());
                      const y = getY(point.price);
                      const isHovered = hoveredPoint === point;
                      return (
                        <g key={i} className="cursor-pointer group" onMouseEnter={() => setHoveredPoint(point)} onMouseLeave={() => setHoveredPoint(null)}>
                          {isHovered && <line x1={x} y1={y} x2={x} y2={height - padding.bottom} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />}
                          <circle cx={x} cy={y} r={isHovered ? 8 : 5} fill="white" stroke="#2563eb" strokeWidth={isHovered ? 4 : 2.5} className="transition-all duration-200" />
                          <circle cx={x} cy={y} r="20" fill="transparent" />
                        </g>
                      );
                    })}

                    <text x={getX(minDate)} y={height - 5} textAnchor="start" fontSize="9" fontWeight="800" fill="#94a3b8" className="uppercase tracking-widest">
                      {formatDate(chartData[0].date)}
                    </text>
                    <text x={getX(maxDate)} y={height - 5} textAnchor="end" fontSize="9" fontWeight="800" fill="#94a3b8" className="uppercase tracking-widest">
                      {formatDate(chartData[chartData.length - 1].date)}
                    </text>
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'list' && (
          <div className="animate-fade-in">
             <div className="mb-6 flex items-center gap-2">
               <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vertical Event Timeline</h4>
             </div>
             
             {activeData.length > 0 ? (
                <div className="relative pl-4">
                  <div className="absolute left-[29px] top-4 bottom-4 w-1 bg-slate-100 rounded-full"></div>
                  <div className="space-y-8">
                      {[...activeData].reverse().map((point, i) => (
                        <div key={i} className="relative flex items-start gap-6 group">
                          <div className="relative z-10 flex-shrink-0 mt-1.5">
                            <div className={`w-4 h-4 rounded-full ring-4 ring-white shadow-md transition-transform group-hover:scale-125 ${
                              point.price === null ? 'bg-slate-300' : 
                              metric === 'sale' ? 'bg-blue-600' : 'bg-emerald-500'
                            }`}></div>
                          </div>
                          <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm group-hover:shadow-md group-hover:border-blue-100 transition-all border-l-4 border-l-blue-500">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                <span className={`text-lg font-black tracking-tight ${point.price === null ? 'text-slate-400 italic font-medium' : 'text-slate-900'}`}>
                                  {point.formattedPrice}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                  <Calendar size={12} className="text-slate-300" />
                                  {new Date(point.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
                                  metric === 'sale' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}>
                                  {point.event || (metric === 'sale' ? 'Sale Event' : 'Rental Event')}
                                </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
             ) : (
                <div className="py-20 text-center text-slate-400 font-medium italic bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                  No historical records found for this metric.
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
