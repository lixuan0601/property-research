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
  const padding = { top: 30, right: 30, bottom: 30, left: 70 }; // Increased left padding for larger currency values

  const prices = chartData.map(d => d.price);
  const dates = chartData.map(d => new Date(d.date).getTime());

  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);

  // Scales
  const getX = (date: number) => {
    if (minDate === maxDate) return width / 2;
    return padding.left + ((date - minDate) / (maxDate - minDate)) * (width - padding.left - padding.right);
  };

  const getY = (price: number) => {
    if (minPrice === maxPrice) return height / 2;
    return height - padding.bottom - ((price - minPrice) / (maxPrice - minPrice)) * (height - padding.top - padding.bottom);
  };

  // Generate path
  const pathD = chartData.reduce((acc, point, i) => {
    const x = getX(new Date(point.date).getTime());
    const y = getY(point.price);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Generate fill area
  const areaD = chartData.length > 1 
    ? `${pathD} L ${getX(maxDate)} ${height - padding.bottom} L ${getX(minDate)} ${height - padding.bottom} Z`
    : '';

  // Formatters
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    // Use standard locale string for values < 1M to avoid "stripped 000" (e.g., show "32,000" not "32k")
    return `$${val.toLocaleString()}`;
  };

  // Switch metric handler (safeguard if data missing)
  const handleMetricChange = (newMetric: 'sale' | 'rent') => {
    if (newMetric === 'sale' && salesData.length === 0) return;
    if (newMetric === 'rent' && rentData.length === 0) return;
    setMetric(newMetric);
    setHoveredPoint(null); // Clear tooltip
  };

  return (
    <div className="mt-2 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      {/* Header / Controls */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
        
        {/* Metric Toggles (Sale vs Rent) */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => handleMetricChange('sale')}
            disabled={salesData.length === 0}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
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
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              metric === 'rent'
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            Rental History
          </button>
        </div>

        {/* View Toggles (Chart vs List) */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('chart')}
            className={`p-1.5 rounded-md transition-all ${
              view === 'chart' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Chart View"
          >
            <TrendingUp size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-all ${
              view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            title="List View"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 min-h-[220px]">
        {/* Empty State / Fallback for chart view */}
        {view === 'chart' && chartData.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <TrendingUp size={24} className="mb-2 opacity-50" />
            <span>No numeric {metric} data available for charting.</span>
            {activeData.length > 0 && <span className="text-xs mt-1 text-slate-500">Switch to List View to see event history.</span>}
          </div>
        )}

        {/* CHART VIEW */}
        {view === 'chart' && chartData.length > 0 && (
          <div className="relative w-full animate-fade-in">
             <div className="mb-4 flex items-center justify-between h-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar size={12} />
                Timeline Analysis
              </h4>
              {hoveredPoint && (
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full shadow-sm border border-blue-100 flex items-center gap-2">
                  <span>{hoveredPoint.formattedPrice}</span>
                  <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                  <span className="font-normal text-slate-500">{formatDate(hoveredPoint.date)}</span>
                </div>
              )}
            </div>

            {chartData.length === 1 ? (
               // Single point fallback
               <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  <div className="text-3xl font-bold text-slate-700">{chartData[0].formattedPrice}</div>
                  <div className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-200 rounded text-xs text-slate-600">{chartData[0].event || 'Listed'}</span>
                    <span>{formatDate(chartData[0].date)}</span>
                  </div>
               </div>
            ) : (
              // Actual Chart
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: '35%' }}>
                <div className="absolute inset-0">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                      const y = height - padding.bottom - tick * (height - padding.top - padding.bottom);
                      const price = minPrice + tick * (maxPrice - minPrice);
                      return (
                        <g key={tick}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={width - padding.right}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={padding.left - 10}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#94a3b8"
                          >
                            {formatCurrency(price)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient Defs */}
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#chartGradient)" />

                    {/* Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {chartData.map((point, i) => {
                      const x = getX(new Date(point.date).getTime());
                      const y = getY(point.price);
                      const isHovered = hoveredPoint === point;
                      return (
                        <g 
                          key={i} 
                          className="cursor-pointer group"
                          onMouseEnter={() => setHoveredPoint(point)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          {/* Hover Guide Line */}
                          {isHovered && (
                            <line 
                              x1={x} y1={y} x2={x} y2={height - padding.bottom}
                              stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2"
                            />
                          )}
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 6 : 4}
                            fill="white"
                            stroke="#2563eb"
                            strokeWidth={isHovered ? 3 : 2}
                            className="transition-all duration-200"
                          />
                          <circle cx={x} cy={y} r="16" fill="transparent" />
                        </g>
                      );
                    })}

                    {/* X Axis Labels (First and Last) */}
                    <text x={getX(minDate)} y={height - 10} textAnchor="start" fontSize="10" fill="#94a3b8">
                      {formatDate(chartData[0].date)}
                    </text>
                    <text x={getX(maxDate)} y={height - 10} textAnchor="end" fontSize="10" fill="#94a3b8">
                      {formatDate(chartData[chartData.length - 1].date)}
                    </text>
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIST VIEW - Mixed: Timeline + Full Raw Content */}
        {view === 'list' && (
          <div className="animate-fade-in">
             {/* Timeline Section for currently selected metric - USES ACTIVE DATA (includes nulls) */}
             {activeData.length > 0 && (
                <div className="relative pl-2 mb-8">
                  <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-slate-200 rounded-full"></div>
                  <div className="space-y-6">
                      {[...activeData].reverse().map((point, i) => (
                        <div key={i} className="relative flex items-start gap-4">
                          <div className="relative z-10 flex-shrink-0 mt-1">
                            <div className={`w-3 h-3 rounded-full ring-4 ring-white shadow-sm ${point.price === null ? 'bg-slate-400' : 'bg-blue-500'}`}></div>
                          </div>
                          <div className="flex-1 bg-white border border-slate-100 rounded-lg p-3 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-semibold ${point.price === null ? 'text-slate-500 italic' : 'text-slate-800'}`}>
                                  {point.formattedPrice}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">{new Date(point.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  {point.event || (metric === 'sale' ? 'Listed' : 'For Rent')}
                                </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
             )}

             {/* Raw Content Section to capture unparsed data */}
             {rawContent && (
               <div className={`${activeData.length > 0 ? 'pt-6 border-t border-slate-100' : ''}`}>
                 <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                   <FileText size={14} /> Full History & Notes
                 </h4>
                 <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-sm text-slate-600 space-y-2 leading-relaxed">
                    {rawContent.split('\n').filter(l => l.trim().length > 0).map((line, i) => (
                      <p key={i} className={line.trim().startsWith('-') || line.trim().startsWith('•') ? 'pl-4 -indent-4' : ''}>
                        {line}
                      </p>
                    ))}
                 </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};