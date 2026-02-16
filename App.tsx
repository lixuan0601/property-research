
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Search, MapPin, Loader2, Building2, Download, MessageSquare, 
  Info, LayoutDashboard, TrendingUp, GraduationCap, Map as MapIcon, 
  Lightbulb, ExternalLink, Home, Tag, Sparkles, DollarSign, 
  BedDouble, Calendar, CheckCircle2, ChevronRight, List, Clock,
  Plus, Trash2, ArrowRight, ArrowLeft, X, ChevronLeft, Columns,
  Bath, Car, Maximize, Sun, Building, Scale, Waves, Zap, Battery,
  Layout, Layers, Warehouse, Users, Target, Rocket, Activity,
  Globe, MousePointer2, AlertCircle
} from 'lucide-react';
import { analyzeProperty } from './services/analyzePropertyService';
import { searchPropertiesAgent } from './services/searchPropertiesService';
import { parseAnalysisSections } from './services/dataParser';
import { AnalysisState, SectionData, SectionProgress, ViewMode, AgentSearchResult, PropertyData, GroundingChunk } from './types';
import { IntelligenceCard } from './components/IntelligenceCard';
import { AnalysisProgress } from './components/AnalysisProgress';
import { MultiMarkerMap } from './components/MultiMarkerMap';

const STATUS_KEYWORDS = ['SOLD', 'FOR SALE', 'FOR RENT', 'LEASED', 'RECENTLY SOLD', 'CONTINGENT', 'ACTIVE', 'PENDING'];

const SUGGESTIONS = [
  { label: 'Under $1.5M in Kenmore QLD', icon: DollarSign, color: 'text-emerald-500', query: 'Find 3+ bed houses under $1.5M in Kenmore, QLD' },
  { label: 'High Yield > 5% Investment', icon: Activity, color: 'text-blue-500', query: 'Search for properties with high rental yield > 5% in Brisbane suburbs' },
  { label: 'Solar Battery & Green Tech', icon: Battery, color: 'text-amber-500', query: 'Houses with solar panels and battery storage in Brisbane' },
  { label: 'Sold in last 30 Days', icon: Clock, color: 'text-rose-500', query: 'Show me properties sold in the last 30 days in Indooroopilly' },
  { label: 'Waterfront Subdivisions', icon: Waves, color: 'text-cyan-500', query: 'Waterfront properties in new subdivisions on the Gold Coast' },
  { label: '4+ Bed with Granny Flat', icon: Users, color: 'text-purple-500', query: '4+ bedroom houses with a granny flat or dual living in QLD' },
  { label: 'Luxury Townhouse Catchments', icon: GraduationCap, color: 'text-indigo-500', query: 'Luxury townhouses in elite school catchment zones' },
];

const getStatusColor = (status: string) => {
  const s = status.toUpperCase();
  if (s.includes('SOLD')) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500', highlight: 'bg-red-50/50 text-red-700 border-red-100' };
  if (s.includes('SALE') || s.includes('ACTIVE')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500', highlight: 'bg-blue-50/50 text-blue-700 border-blue-100' };
  if (s.includes('RENT') || s.includes('LEASED')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500', highlight: 'bg-emerald-50/50 text-emerald-700 border-emerald-100' };
  if (s.includes('CONTINGENT') || s.includes('PENDING')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500', highlight: 'bg-amber-50/50 text-amber-700 border-amber-100' };
  return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', dot: 'bg-slate-500', highlight: 'bg-slate-50/50 text-slate-700 border-slate-100' };
};

const getStatusFromTitle = (title: string) => {
  const statusMatch = title.match(/\[(.*?)\]/);
  if (statusMatch) return statusMatch[1].toUpperCase();
  const foundKeyword = STATUS_KEYWORDS.find(k => title.toUpperCase().includes(k));
  return foundKeyword || 'OTHER';
};

const toPropertySlug = (address: string) => {
  return address
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const findUrlInGrounding = (address: string, chunks: GroundingChunk[], domain: 'domain' | 'realestate') => {
  const targetHost = domain === 'domain' ? 'domain.com.au' : 'realestate.com.au';
  const addressParts = address.toLowerCase().split(/[ ,]+/).filter(p => p.length > 2);
  
  // Find a chunk where the URL contains most of the address parts
  // We score them to find the best match
  let bestMatch: GroundingChunk | null = null;
  let highestScore = 0;

  chunks.forEach(c => {
    if (!c.web?.uri) return;
    const uri = c.web.uri.toLowerCase();
    if (!uri.includes(targetHost)) return;

    // Direct matches score higher
    const matches = addressParts.filter(part => uri.includes(part)).length;
    
    // Pattern matches score higher
    let patternScore = 0;
    if (domain === 'domain' && uri.includes('property-profile')) patternScore = 2;
    if (domain === 'realestate' && uri.includes('/property/')) patternScore = 2;

    const totalScore = matches + patternScore;

    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestMatch = c;
    }
  });

  // Only return if we have a reasonably confident match (at least 3 parts matching)
  return highestScore >= 3 ? bestMatch?.web?.uri : null;
};

const ComparisonCarousel = ({ 
  items, 
  onBack 
}: { 
  items: PropertyData[], 
  onBack: () => void 
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 3;
  const maxIndex = Math.max(0, items.length - visibleCount);

  const next = () => setStartIndex(prev => Math.min(prev + 1, maxIndex));
  const prev = () => setStartIndex(prev => Math.max(prev - 1, 0));

  const visibleItems = items.slice(startIndex, startIndex + visibleCount);

  const CompareRow = ({ label, icon: Icon, value, colorClass = "text-slate-800" }: { label: string, icon: any, value: string | React.ReactNode, colorClass?: string }) => (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
        <Icon size={12} className="opacity-70" /> {label}
      </div>
      <div className={`text-sm font-bold ${colorClass}`}>
        {value || <span className="text-slate-300">N/A</span>}
      </div>
    </div>
  );

  const FeatureBadge = ({ label, icon: Icon, active, color = "blue" }: { label: string, icon: any, active?: boolean, color?: string }) => {
    if (!active) return null;
    const colors: Record<string, string> = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100"
    };
    return (
      <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border w-fit ${colors[color] || colors.blue}`}>
        <Icon size={12} /> {label}
      </span>
    );
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md mb-4"
          >
            <ChevronLeft size={16} /> Back to Results
          </button>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Scale size={28} />
            </div>
            Property Comparison
          </h2>
        </div>
        
        <div className="flex items-center gap-5 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">
            Viewing {startIndex + 1}—{Math.min(startIndex + visibleCount, items.length)} <span className="text-slate-200 mx-2">/</span> {items.length} Properties
          </span>
          <div className="flex gap-2">
            <button 
              disabled={startIndex === 0}
              onClick={prev}
              className="p-3 rounded-2xl border border-slate-200 bg-white shadow-sm disabled:opacity-20 disabled:cursor-not-allowed hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <button 
              disabled={startIndex >= maxIndex}
              onClick={next}
              className="p-3 rounded-2xl border border-slate-200 bg-white shadow-sm disabled:opacity-20 disabled:cursor-not-allowed hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {visibleItems.map((prop) => {
          const colors = getStatusColor(prop.status);
          const isSold = prop.status.includes('SOLD');
          
          return (
            <div key={prop.id} className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-in relative group/card">
              <div className={`h-2.5 w-full ${colors.dot}`}></div>
              
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-8">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-4 shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`}></span>
                    {prop.status}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover/card:text-blue-600 transition-colors min-h-[3rem]">{prop.address}</h3>
                  <div className="text-3xl font-black text-blue-600 tracking-tight">{prop.price || 'Price on request'}</div>
                </div>

                <div className="space-y-1 flex-1">
                  <CompareRow label="Property Type" icon={Building} value={prop.type} colorClass="text-blue-700" />
                  <CompareRow label="Bedrooms" icon={BedDouble} value={prop.beds} />
                  <CompareRow label="Bathrooms" icon={Bath} value={prop.baths} />
                  <CompareRow label="Garage / Parking" icon={Car} value={prop.cars} />
                  <CompareRow label="Land Size" icon={Maximize} value={prop.landSize} />
                  <CompareRow label={isSold ? "Sold Date" : "Listing Date"} icon={Calendar} value={prop.date} colorClass="text-slate-500" />
                  
                  <div className="py-4 space-y-3">
                    <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Premium Features</h4>
                    <div className="flex flex-wrap gap-2">
                       <FeatureBadge label="Swimming Pool" icon={Waves} active={prop.pool} color="emerald" />
                       <FeatureBadge label="Solar Panels" icon={Sun} active={prop.solar} color="amber" />
                       <FeatureBadge label="Solar Battery" icon={Battery} active={prop.battery} color="amber" />
                       <FeatureBadge label="Tennis Court" icon={Zap} active={prop.tennis} color="purple" />
                       <FeatureBadge label="Deck" icon={Layout} active={prop.deck} color="blue" />
                       <FeatureBadge label="Balcony" icon={Layers} active={prop.balcony} color="blue" />
                       <FeatureBadge label="Shed" icon={Warehouse} active={prop.shed} color="blue" />
                       <FeatureBadge label="Granny Flat" icon={Users} active={prop.grannyFlat} color="emerald" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Market Summary</span>
                  </div>
                  <p className="text-[13px] text-slate-600 leading-relaxed italic font-medium">
                    "{prop.description || 'No specific listing highlights available.'}"
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AgentResultView = ({ 
  result, 
  onAddToCompare,
  compareList
}: { 
  result: AgentSearchResult,
  onAddToCompare: (prop: PropertyData) => void,
  compareList: PropertyData[]
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapHighlight, setMapHighlight] = useState<string | undefined>(undefined);

  const { introText, categorizedCards, allProperties } = useMemo(() => {
    const cleanText = result.answer.replace(/\*\*/g, '');
    const lines = cleanText.split('\n');
    
    const intro: string[] = [];
    const categories: Record<string, PropertyData[]> = {};
    const all: PropertyData[] = [];
    let current: PropertyData | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('### ')) {
        if (current) {
          const status = current.status;
          if (!categories[status]) categories[status] = [];
          categories[status].push(current);
          all.push(current);
        }
        const title = trimmed.substring(4);
        const status = getStatusFromTitle(title);
        const address = title.replace(/\[.*?\]/, '').trim();
        current = { 
          id: btoa(address).substring(0, 16),
          address, 
          status, 
          rawItems: [],
          type: 'House'
        };
      } else if (trimmed.startsWith('- ') && current) {
        current.rawItems.push(trimmed.substring(2));
        const lineContent = trimmed.substring(2).trim();
        const lower = lineContent.toLowerCase();
        
        if (lower.startsWith('price:')) {
          current.price = lineContent.split(':')[1]?.trim();
        } else if (lower.startsWith('listed:') || lower.startsWith('sold date:') || lower.startsWith('sold:')) {
          current.date = lineContent.split(':')[1]?.trim() || lineContent.replace(/sold\s*[:\-]/i, '').trim();
        } else if (lower.startsWith('domain:')) {
          const url = lineContent.replace(/domain\s*[:\-]\s*/i, '').trim();
          if (url && url.startsWith('http')) current.domainUrl = url;
        } else if (lower.startsWith('rea:') || lower.startsWith('realestate:')) {
          const url = lineContent.replace(/(?:rea|realestate)\s*[:\-]\s*/i, '').trim();
          if (url && url.startsWith('http')) current.realestateUrl = url;
        } else if (lower.startsWith('attributes:') || lower.startsWith('attr:')) {
          const val = lineContent.split(':')[1]?.trim();
          if (val) {
            current.features = current.features ? `${val} • ${current.features}` : val;
            const beds = val.match(/(\d+)\s*(?:bed|br)/i);
            const baths = val.match(/(\d+)\s*(?:bath|ba)/i);
            const cars = val.match(/(\d+)\s*(?:car|pkg|grg|garage)/i);
            if (beds) current.beds = beds[1];
            if (baths) current.baths = baths[1];
            if (cars) current.cars = cars[1];
          }
        } else if (lower.startsWith('summary:') || lower.startsWith('features:') || lower.startsWith('feat:')) {
          const val = lineContent.split(':')[1]?.trim();
          if (val) {
            current.description = current.description ? `${current.description} ${val}` : val;
            const text = val.toLowerCase();
            if (text.includes('solar')) current.solar = true;
            if (text.includes('pool')) current.pool = true;
          }
        }
      } else {
        if (!current) {
          intro.push(trimmed);
        } else {
          const status = current.status;
          if (!categories[status]) categories[status] = [];
          categories[status].push(current);
          all.push(current);
          current = null;
          intro.push(trimmed);
        }
      }
    });

    if (current) {
      const status = (current as PropertyData).status;
      if (!categories[status]) categories[status] = [];
      categories[status].push(current);
      all.push(current);
    }

    // Post-process with grounding correlation if direct text URLs missed
    all.forEach(prop => {
      if (!prop.domainUrl) prop.domainUrl = findUrlInGrounding(prop.address, result.sources, 'domain');
      if (!prop.realestateUrl) prop.realestateUrl = findUrlInGrounding(prop.address, result.sources, 'realestate');
    });

    return { introText: intro, categorizedCards: categories, allProperties: all };
  }, [result]);

  const highlightKeywords = (str: string) => {
    let parts: React.ReactNode[] = [str];
    STATUS_KEYWORDS.forEach(word => {
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        const regex = new RegExp(`(${word})`, 'gi');
        const segments = part.split(regex);
        segments.forEach((seg, i) => {
          if (seg.toUpperCase() === word) {
            const colors = getStatusColor(seg);
            newParts.push(
              <span key={`${word}-${i}`} className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mx-1 border shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`}></span>
                {seg.toUpperCase()}
              </span>
            );
          } else if (seg) {
            newParts.push(seg);
          }
        });
      });
      parts = newParts;
    });
    return parts;
  };

  const handleShowOnMap = (address: string) => {
    setMapHighlight(address);
    setViewMode('map');
  };

  const renderPropertyCard = (prop: PropertyData, key: string) => {
    const colors = getStatusColor(prop.status);
    const isSold = prop.status.includes('SOLD');
    const specs = [prop.features, prop.landSize].filter(Boolean).join(' • ');
    const isAlreadySelected = compareList.some(item => item.id === prop.id);

    // To prevent 404 errors, we prefer verified URLs from grounding.
    // If no verified link is available, we redirect to a Google Search specifically for that property on Domain.
    // Guessed slugs (e.g. /property-profile/slug) frequently 404 due to complex address formatting.
    const domainProfile = prop.domainUrl || `https://www.google.com/search?q=site:domain.com.au+${encodeURIComponent(prop.address)}`;

    return (
      <div key={key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-default">
        <div className="p-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-blue-50 rounded-full text-blue-500 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Home size={16} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <a 
                    href={domainProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View Property Profile (Verified Search)"
                    className="font-bold text-slate-800 text-sm leading-tight hover:text-blue-700 transition-colors cursor-pointer border-b-2 border-transparent hover:border-blue-500/20 inline-block decoration-blue-500/30"
                  >
                    {prop.address.replace(new RegExp(prop.status, 'gi'), '').trim() || prop.address}
                  </a>
                  <ExternalLink size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="mt-2.5 flex flex-wrap gap-3 items-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`}></span>
                    {prop.status}
                  </span>
                  
                  <button 
                    onClick={() => handleShowOnMap(prop.address)}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider ml-2 group/btn"
                  >
                    <MapIcon size={12} className="group-hover/btn:scale-110 transition-transform" />
                    <span>View on Map</span>
                  </button>

                  <button 
                    onClick={() => onAddToCompare(prop)}
                    disabled={isAlreadySelected}
                    className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ml-2 transition-all ${isAlreadySelected ? 'text-green-500' : 'text-slate-400 hover:text-blue-600'}`}
                  >
                    {isAlreadySelected ? <CheckCircle2 size={12} /> : <Plus size={12} />}
                    <span>{isAlreadySelected ? 'Added to Compare' : 'Add to Compare'}</span>
                  </button>
                </div>
              </div>
            </div>
            
            {prop.price && (
              <div className="flex flex-col items-end flex-shrink-0 text-right">
                <span className="text-xl font-extrabold text-blue-600 tracking-tight">{prop.price}</span>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest mt-0.5">Estimated Price</span>
              </div>
            )}
          </div>

          {prop.date && (
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border mb-4 text-xs font-bold tracking-tight animate-fade-in ${colors.highlight}`}>
              <Clock size={14} className="opacity-70" />
              <span>{isSold ? 'Sold on' : 'Listed on'}: {prop.date}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 font-medium leading-relaxed flex items-center">
                <span className="font-extrabold text-slate-300 uppercase text-[9px] tracking-widest mr-2 flex-shrink-0">Features</span>
                <span className="text-slate-700 font-bold group-hover:text-slate-900 transition-colors">{specs || 'Details available on request'}</span>
              </p>
              
              {prop.description && (
                <p className="text-[13px] text-slate-600 leading-relaxed font-medium pl-[58px] border-l-2 border-slate-100 ml-1 mt-1 italic">
                  {prop.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const statusDisplayOrder = ['SOLD', 'RECENTLY SOLD', 'FOR SALE', 'ACTIVE', 'FOR RENT', 'LEASED', 'PENDING', 'CONTINGENT', 'OTHER'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
          <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600 shadow-sm">
            <Sparkles size={28} />
          </div>
          Market Search Intelligence
        </h2>
        
        {allProperties.length > 0 && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner w-fit">
            <button 
              onClick={() => { setViewMode('list'); setMapHighlight(undefined); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={16} /> List View
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MapIcon size={16} /> Map View
            </button>
          </div>
        )}
      </div>

      <div className="intro-section">
        {introText.map((p, i) => (
          <p key={i} className="mb-4 text-slate-600 leading-relaxed text-sm last:mb-0">
            {highlightKeywords(p)}
          </p>
        ))}
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-10">
          {statusDisplayOrder.map(status => {
            const cards = categorizedCards[status];
            if (!cards || cards.length === 0) return null;
            const colors = getStatusColor(status);
            return (
              <div key={status} className="category-group animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-px flex-1 ${colors.border.replace('border', 'bg')}`}></div>
                  <h3 className={`text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                    {status} <span className="ml-1 opacity-50">({cards.length})</span>
                  </h3>
                  <div className={`h-px flex-1 ${colors.border.replace('border', 'bg')}`}></div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {cards.map((card, idx) => renderPropertyCard(card, `${status}-${idx}`))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="animate-fade-in space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span> 
                <span>Sold</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm"></span> 
                <span>For Sale</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></span> 
                <span>For Rent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-sm"></span> 
                <span>Pending</span>
              </div>
            </div>
            {mapHighlight && (
              <button 
                onClick={() => setMapHighlight(undefined)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 transition-all"
              >
                Clear Focus
              </button>
            )}
          </div>
          <div className="w-full h-[600px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-inner relative group/map">
            <MultiMarkerMap 
              comparables={allProperties.map(p => ({
                address: p.address,
                status: p.status,
                label: p.price
              }))}
              highlightAddress={mapHighlight}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode | null>(null);
  const [comparisonList, setComparisonList] = useState<PropertyData[]>([]);
  
  const [address, setAddress] = useState('');
  const [insightState, setInsightState] = useState<AnalysisState>({
    status: 'idle',
    data: null
  });
  const [insightProgress, setInsightProgress] = useState<Record<string, SectionProgress>>({});
  
  const [agentQuery, setAgentQuery] = useState('');
  const [agentStatus, setAgentStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [agentResult, setAgentResult] = useState<AgentSearchResult | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCompleteRef = useRef<any>(null);

  const TABS = [
    'Property Overview',
    'Investment Insights',
    'Price History',
    'Suburb Profile',
    'School Catchment & Ratings'
  ];
  const [activeTab, setActiveTab] = useState(TABS[0]);

  useEffect(() => {
    if (!activeView || activeView === 'compare') return;

    const loadGoogleMapsScript = () => {
      if ((window as any).google?.maps?.places) {
        initAutocomplete();
        return;
      }
      if (document.getElementById('google-maps-script')) return;
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB0dDMOVbcQkBfYpFu5HJY6N0HdMUFBPsk&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initAutocomplete();
      document.body.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!inputRef.current || !(window as any).google) return;
      if (autoCompleteRef.current) return;
      try {
        autoCompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['formatted_address'],
          componentRestrictions: { country: 'au' },
        });
        autoCompleteRef.current.addListener('place_changed', () => {
          const place = autoCompleteRef.current.getPlace();
          if (place.formatted_address) setAddress(place.formatted_address);
        });
      } catch (error) {
        console.error("Autocomplete Error:", error);
      }
    };

    loadGoogleMapsScript();
  }, [activeView]);

  const handleAgentSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery || agentQuery;
    if (!queryToUse.trim()) return;
    
    if (customQuery) setAgentQuery(customQuery);
    
    setAgentStatus('loading');
    setAgentResult(null);
    try {
      const res = await searchPropertiesAgent(queryToUse);
      setAgentResult(res);
      setAgentStatus('loading');
      setTimeout(() => setAgentStatus('success'), 100);
    } catch (err) {
      setAgentStatus('error');
    }
  };

  const handleInsightSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAddress = address.trim();
    if (!targetAddress) return;

    setInsightState({ status: 'loading', data: null, coordinates: undefined });
    setInsightProgress({});
    setActiveTab(TABS[0]);

    if ((window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: targetAddress }, (results: any, status: string) => {
        if (status === 'OK' && results[0]) {
          const coords = results[0].geometry.location.toJSON();
          setInsightState(prev => ({ ...prev, coordinates: coords }));
        }
      });
    }

    try {
      const result = await analyzeProperty(targetAddress, (update) => {
        setInsightProgress(prev => ({ ...prev, [update.key]: update }));
      });
      setInsightState(prev => ({ ...prev, status: 'success', data: result }));
    } catch (err: any) {
      setInsightState({ status: 'error', data: null, error: err.message || "Error" });
    }
  }, [address]);

  const handleAddToCompare = (prop: PropertyData) => {
    if (comparisonList.length >= 10) {
      alert("You can only compare up to 10 properties.");
      return;
    }
    if (!comparisonList.find(p => p.id === prop.id)) {
      setComparisonList(prev => [...prev, prop]);
    }
  };

  const handleRemoveFromCompare = (id: string) => {
    setComparisonList(prev => prev.filter(p => p.id !== id));
  };

  const handleDownloadReport = async () => {
    if (isGeneratingPdf || !(window as any).html2pdf) return;
    setIsGeneratingPdf(true);
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) { setIsGeneratingPdf(false); return; }
      const opt = {
        margin: 0, 
        filename: `PropSearch_Intel_${address.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      try { await (window as any).html2pdf().set(opt).from(element).save(); } 
      catch (error) { console.error("PDF generation failed:", error); } 
      finally { setIsGeneratingPdf(false); }
    }, 1500);
  };

  const sections = insightState.data ? parseAnalysisSections(insightState.data.text) : [];
  const activeSectionData = sections.find(s => s.title === activeTab);

  const getTabIcon = (tab: string) => {
    switch(tab) {
      case 'Property Overview': return LayoutDashboard;
      case 'Price History': return TrendingUp;
      case 'Suburb Profile': return MapIcon;
      case 'School Catchment & Ratings': return GraduationCap;
      case 'Investment Insights': return Lightbulb;
      default: return LayoutDashboard;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveView(null); setAgentResult(null); }}>
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">PropSearch<span className="text-blue-600">Intel</span></span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <div className={`flex-1 overflow-y-auto transition-all duration-500 ${activeView === 'talk' && comparisonList.length > 0 ? 'mr-80' : ''}`}>
          
          {activeView !== 'compare' && (
            <div className="bg-white border-b border-slate-200 pb-12 pt-16 px-4 shadow-sm">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                  Advanced Real Estate <span className="text-blue-600">Intelligence</span>
                </h1>
                
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                  <button 
                    onClick={() => { setActiveView('talk'); setInsightState({status:'idle', data:null}); }}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${activeView === 'talk' ? 'bg-blue-600 text-white scale-105' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-md'}`}
                  >
                    <MessageSquare size={24} />
                    Talk to AI Agent
                  </button>
                  <button 
                    onClick={() => { setActiveView('insight'); setAgentStatus('idle'); setAgentResult(null); }}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${activeView === 'insight' ? 'bg-indigo-600 text-white scale-105' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-indigo-200 hover:shadow-md'}`}
                  >
                    <Info size={24} />
                    Property Insight
                  </button>
                </div>

                {activeView === 'talk' && (
                  <div className="max-w-3xl mx-auto animate-fade-in">
                    <p className="text-slate-500 mb-6 flex items-center justify-center gap-2">
                      <Sparkles size={16} className="text-blue-500" />
                      Ask the AI Agent to find properties, suburbs, or market trends for you.
                    </p>
                    <form onSubmit={(e) => handleAgentSearch(e)} className="relative group mb-8">
                      <input
                        type="text"
                        className="block w-full pl-6 pr-12 py-5 bg-white border border-slate-200 rounded-3xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-xl hover:shadow-2xl transition-all text-lg"
                        placeholder="e.g. Find me 3-bed houses in Paddington under $2M..."
                        value={agentQuery}
                        onChange={(e) => setAgentQuery(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={agentStatus === 'loading' || !agentQuery.trim()}
                        className="absolute inset-y-3 right-3 px-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
                      >
                        {agentStatus === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                      </button>
                    </form>

                    {agentStatus === 'error' && (
                      <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl animate-fade-in">
                         <div className="flex items-center gap-3 text-rose-600 mb-2">
                           <AlertCircle size={20} />
                           <span className="font-bold">Intelligence Service Overloaded</span>
                         </div>
                         <p className="text-sm text-rose-500">The market intelligence model is currently experiencing high demand. Our automated retries were unsuccessful. Please try your search again in a few moments.</p>
                         <button 
                           onClick={(e) => handleAgentSearch(e)}
                           className="mt-4 px-6 py-2 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-md"
                         >
                           Retry Search
                         </button>
                      </div>
                    )}

                    {!agentResult && agentStatus !== 'loading' && (
                      <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-6 justify-center">
                          <div className="h-px w-8 bg-slate-200"></div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Rocket size={12} className="text-blue-500" /> AI Neural Suggestions
                          </span>
                          <div className="h-px w-8 bg-slate-200"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4">
                          {SUGGESTIONS.map((s, i) => {
                            const SuggestionIcon = s.icon;
                            return (
                              <button
                                key={i}
                                onClick={() => handleAgentSearch(undefined, s.query)}
                                className="group relative flex items-start gap-3 p-4 bg-white/40 backdrop-blur-sm border border-slate-200 rounded-2xl text-left hover:bg-white hover:border-blue-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 animate-slide-in"
                                style={{ animationDelay: `${i * 100}ms` }}
                              >
                                <div className={`mt-0.5 p-2 rounded-xl bg-white border border-slate-100 shadow-sm ${s.color} group-hover:scale-110 transition-transform`}>
                                  <SuggestionIcon size={16} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-800 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                                    {s.label}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-500">
                                    Try this Query
                                  </span>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ChevronRight size={14} className="text-blue-400" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeView === 'insight' && (
                  <div className="max-w-2xl mx-auto animate-fade-in">
                    <p className="text-slate-500 mb-6">Enter a specific address for a detailed intelligence report.</p>
                    <form onSubmit={handleInsightSearch} className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        ref={inputRef}
                        type="text"
                        className="block w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all text-lg"
                        placeholder="Enter property address..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={insightState.status === 'loading' || !address.trim()}
                        className="absolute inset-y-2.5 right-2.5 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex items-center justify-center shadow-md"
                      >
                        {insightState.status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                      </button>
                    </form>
                    {insightState.status === 'loading' && <AnalysisProgress progress={insightProgress} />}
                  </div>
                )}
              </div>
            </div>
          )}

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {activeView === 'compare' ? (
              <ComparisonCarousel 
                items={comparisonList} 
                onBack={() => setActiveView('talk')} 
              />
            ) : (
              <>
                {activeView === 'talk' && agentResult && (
                  <div className="animate-fade-in space-y-12">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm leading-relaxed text-slate-800 max-w-none">
                      <AgentResultView 
                        result={agentResult} 
                        onAddToCompare={handleAddToCompare}
                        compareList={comparisonList}
                      />
                    </div>
                  </div>
                )}

                {activeView === 'insight' && insightState.status === 'success' && insightState.data && (
                  <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence Report</h2>
                        <span className="text-xs text-slate-500 font-bold px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm mt-2 inline-block uppercase tracking-wider">For: {address}</span>
                      </div>
                      <button onClick={handleDownloadReport} disabled={isGeneratingPdf} className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg font-bold hover:shadow-indigo-200 active:scale-95">
                        {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {isGeneratingPdf ? 'Generating PDF...' : 'Download Report'}
                      </button>
                    </div>

                    <div className="mb-6 overflow-x-auto pb-2 custom-scrollbar flex space-x-2 border-b border-slate-200 px-1">
                      {TABS.map((tab) => {
                        const Icon = getTabIcon(tab);
                        const isActive = activeTab === tab;
                        return (
                          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold rounded-t-2xl transition-all relative whitespace-nowrap ${isActive ? 'text-indigo-600 bg-white border border-b-0 border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}>
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} /> {tab}
                            {isActive && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white z-10"></div>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="bg-white rounded-b-3xl rounded-tr-3xl border border-t-0 border-slate-200 shadow-sm min-h-[400px]">
                      {activeSectionData ? (
                        <IntelligenceCard section={activeSectionData} searchAddress={address} allSections={sections} subjectCoords={insightState.coordinates} />
                      ) : (
                        <div className="flex items-center justify-center h-[400px] text-slate-400 font-medium italic">No data available for {activeTab}</div>
                      )}
                    </div>
                  </div>
                )}

                {!activeView && (
                  <div className="text-center py-32 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50 flex flex-col items-center">
                    <div className="bg-white p-6 rounded-full shadow-lg border border-slate-100 mb-8">
                      <Building2 className="text-blue-600" size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Welcome to PropSearch Intel</h3>
                    <p className="text-slate-500 max-w-md mx-auto leading-relaxed">Select a tool above to start your real estate journey. Search for properties with the AI Agent or get deep insights for a specific address.</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {activeView === 'talk' && comparisonList.length > 0 && (
          <aside className="fixed right-0 top-16 bottom-0 w-80 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-50 animate-slide-in-right">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <Columns size={18} className="text-blue-600" /> Comparison Tray
                </h3>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{comparisonList.length}/10 Properties Selected</p>
              </div>
              <button onClick={() => setComparisonList([])} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {comparisonList.map((item) => (
                <div key={item.id} className="group relative bg-slate-50 border border-slate-100 rounded-xl p-4 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
                  <button 
                    onClick={() => handleRemoveFromCompare(item.id)}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X size={12} />
                  </button>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-black text-slate-800 leading-tight truncate">{item.address}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                        <BedDouble size={10} /> {item.beds || '-'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                        <Bath size={10} /> {item.baths || '-'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                        <Maximize size={10} /> {item.landSize?.split(' ')[0] || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => setActiveView('compare')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                Compare All <ChevronRight size={18} />
              </button>
            </div>
          </aside>
        )}
      </div>

      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[9999] bg-slate-100/90 backdrop-blur flex justify-center overflow-auto pt-8">
           <div ref={printRef} className="bg-white w-[210mm] min-h-screen p-[15mm] shadow-2xl mb-8 text-slate-900 mx-auto">
              <div className="text-center mb-12 border-b border-slate-300 pb-8">
                <Building2 className="text-indigo-600 h-12 w-12 mx-auto mb-4" />
                <h1 className="text-3xl font-extrabold tracking-tight">Market Intelligence Report</h1>
                <h2 className="text-xl text-slate-500 font-medium mt-2">{address}</h2>
              </div>
              <div className="space-y-10">
                {sections.map((section, idx) => (
                  <div key={idx} className="break-inside-avoid">
                    <IntelligenceCard section={section} searchAddress={address} hideMap={true} allSections={sections} subjectCoords={insightState.coordinates} />
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
